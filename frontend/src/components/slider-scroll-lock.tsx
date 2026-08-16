/**
 * Prevents parent ScrollView / page scroll while dragging a slider on web (Safari).
 * Native: also claims the responder so the scroll view does not steal the gesture.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Optional: parent can disable ScrollView while dragging */
  onDragChange?: (dragging: boolean) => void;
  testID?: string;
};

const webNoScrollStyle: ViewStyle | null =
  Platform.OS === 'web'
    ? ({
        // RN Web passes these through to DOM — critical for Safari
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      } as ViewStyle)
    : null;

export function SliderScrollLock({ children, style, onDragChange, testID }: Props) {
  const [dragging, setDragging] = useState(false);

  const setDrag = useCallback(
    (next: boolean) => {
      setDragging(next);
      onDragChange?.(next);
    },
    [onDragChange],
  );

  // Safari: block document/body scroll while dragging (ScrollView alone is not enough)
  useEffect(() => {
    if (Platform.OS !== 'web' || !dragging) return;
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.touchAction = prev.bodyTouchAction;
    };
  }, [dragging]);

  return (
    <View
      testID={testID}
      style={[styles.wrap, webNoScrollStyle, style, dragging && styles.dragging]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onTouchStart={() => setDrag(true)}
      onTouchEnd={() => setDrag(false)}
      onTouchCancel={() => setDrag(false)}
      {...(Platform.OS === 'web'
        ? {
            onPointerDown: () => setDrag(true),
            onPointerUp: () => setDrag(false),
            onPointerCancel: () => setDrag(false),
          }
        : null)}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  dragging: {
    // Keep a stable hit target while dragging
    zIndex: 2,
  },
});
