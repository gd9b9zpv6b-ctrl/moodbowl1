"""Email delivery service · Resend SDK.

All transactional emails for MoodBowl go through here:
· Password reset (6-digit OTP)
· Invite code delivery for students/parents

Uses healing color palette that matches the app UI.
Failures are logged but never crash the caller — email is best-effort.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import resend
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
EMAIL_FROM = os.environ.get("EMAIL_FROM", "MoodBowl <onboarding@resend.dev>").strip()
APP_NAME = os.environ.get("APP_NAME", "MoodBowl").strip()

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY not configured · emails will be skipped")


# ----- Shared HTML wrapper (healing palette) -----------------------------------
def _wrap(inner_html: str, preheader: str = "") -> str:
    return f"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#FAF6F1;font-family:-apple-system,BlinkMacSystemFont,'PingFang HK','Noto Sans TC',sans-serif;color:#3B3A36;">
<span style="display:none;font-size:1px;color:#FAF6F1;">{preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F1;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#FFFDFA;border-radius:20px;padding:32px;box-shadow:0 2px 12px rgba(155,120,88,0.08);max-width:480px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <div style="font-size:36px;line-height:1;">🍚</div>
            <div style="font-size:20px;font-weight:800;color:#3B3A36;margin-top:8px;letter-spacing:0.5px;">{APP_NAME}</div>
            <div style="font-size:12px;color:#8A8177;margin-top:2px;">一碗溫暖的情緒安放</div>
          </td>
        </tr>
        <tr>
          <td style="color:#3B3A36;font-size:15px;line-height:1.7;">
            {inner_html}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:32px;border-top:1px solid #EFE7DA;margin-top:24px;">
            <div style="font-size:11px;color:#B5AC9E;padding-top:16px;line-height:1.6;">
              呢封 email 由 {APP_NAME} 自動發送 · 請勿直接回覆<br>
              如果唔係你要求，請忽略呢封 email
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


# ----- Public API --------------------------------------------------------------
def send_email(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Best-effort send · returns True on success · False on any failure (logged)."""
    if not RESEND_API_KEY:
        logger.warning("Skipping email to %s · RESEND_API_KEY not configured", to)
        return False
    try:
        params: dict = {
            "from": EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        if text:
            params["text"] = text
        result = resend.Emails.send(params)
        logger.info("Sent email to %s · id=%s", to, result.get("id") if isinstance(result, dict) else result)
        return True
    except Exception as e:  # noqa: BLE001 — email is best-effort
        logger.error("Failed to send email to %s · %s", to, e)
        return False


def send_password_reset_otp(to: str, display_name: Optional[str], otp: str, minutes_valid: int = 15) -> bool:
    name = (display_name or "").strip() or "朋友"
    inner = f"""
      <div style="font-size:18px;font-weight:700;margin-bottom:12px;">你好 {name} 👋</div>
      <div>我哋收到你重設 {APP_NAME} 密碼嘅要求。請喺 App 入面輸入以下 6 位驗證碼：</div>
      <div style="margin:24px 0;padding:20px;background:#F3EEE5;border-radius:14px;text-align:center;">
        <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#7BA88C;font-family:'SF Mono',Menlo,monospace;">
          {otp}
        </div>
      </div>
      <div style="color:#8A8177;font-size:13px;">
        驗證碼會喺 <b style="color:#3B3A36;">{minutes_valid} 分鐘</b> 之後失效 · 如果唔係你本人要求，請忽略呢封 email，你嘅密碼會保持唔變。
      </div>
    """
    text = (
        f"你好 {name}\n\n"
        f"{APP_NAME} 密碼重設驗證碼：{otp}\n"
        f"驗證碼 {minutes_valid} 分鐘內有效。\n\n"
        f"如果唔係你要求，請忽略呢封 email。"
    )
    return send_email(to, f"【{APP_NAME}】密碼重設驗證碼：{otp}", _wrap(inner, "密碼重設驗證碼"), text)


def send_invite_code(to: str, display_name: Optional[str], invite_code: str,
                     school_name: Optional[str] = None,
                     class_name: Optional[str] = None) -> bool:
    name = (display_name or "").strip() or "同學"
    class_line = ""
    if class_name:
        class_line = f'<div style="color:#8A8177;font-size:13px;margin-bottom:4px;">班別：<b style="color:#3B3A36;">{class_name}</b></div>'
    school_line = ""
    if school_name:
        school_line = f'<div style="color:#8A8177;font-size:13px;margin-bottom:12px;">學校：<b style="color:#3B3A36;">{school_name}</b></div>'

    inner = f"""
      <div style="font-size:18px;font-weight:700;margin-bottom:12px;">你好 {name} 🌱</div>
      <div>學校邀請你加入 <b>{APP_NAME}</b> —— 一個屬於你自己嘅情緒日記空間。</div>
      {school_line}
      {class_line}
      <div style="margin:20px 0 6px;">請喺 App 打開「用邀請碼啟用」，輸入你嘅邀請碼：</div>
      <div style="margin:12px 0 20px;padding:18px;background:#EAF2EE;border-radius:14px;text-align:center;border:1px dashed #7BA88C;">
        <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:#4E7962;font-family:'SF Mono',Menlo,monospace;">
          {invite_code}
        </div>
      </div>
      <div style="color:#8A8177;font-size:13px;line-height:1.7;">
        · 你嘅日記係<b style="color:#3B3A36;">私人</b>嘅 · 老師睇唔到你寫咗咩<br>
        · 你可以喺 App 選擇要唔要匿名分享俾同班同學<br>
        · 你可以隨時導出或刪除你嘅資料
      </div>
    """
    text = (
        f"你好 {name}\n\n"
        f"歡迎加入 {APP_NAME}。你嘅邀請碼：{invite_code}\n"
        f"請喺 App 打開「用邀請碼啟用」輸入呢個碼設定密碼。"
    )
    return send_email(to, f"【{APP_NAME}】你嘅邀請碼：{invite_code}", _wrap(inner, "你嘅 MoodBowl 邀請碼"), text)
