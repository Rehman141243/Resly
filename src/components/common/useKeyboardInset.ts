import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";

/**
 * Android only. When the keyboard covers part of a ScrollView (edge-to-edge or
 * adjustPan windows do not resize it), this adds bottom padding equal to the
 * covered height so the content becomes scrollable, then scrolls the focused
 * input above the keyboard. If Android already resized the view, the inset is 0.
 * iOS uses `automaticallyAdjustKeyboardInsets` on the ScrollView instead.
 */
export function useAndroidKeyboardInset(
  boxRef: RefObject<View | null>,
  scrollRef: RefObject<ScrollView | null>,
) {
  const [inset, setInset] = useState(0);
  const scrollY = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      boxRef.current?.measureInWindow((_x, y, _w, h) => {
        setInset(Math.max(0, Math.round(y + h - keyboardTop)));

        setTimeout(() => {
          const input = (TextInput as any).State?.currentlyFocusedInput?.();
          input?.measureInWindow?.((_ix: number, iy: number, _iw: number, ih: number) => {
            const hidden = iy + ih - (keyboardTop - 24);
            if (hidden > 0) {
              scrollRef.current?.scrollTo({ y: scrollY.current + hidden, animated: true });
            }
          });
        }, 100);
      });
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setInset(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, [boxRef, scrollRef]);

  return { inset, onScroll };
}
