/*
 * Copyright 2015 Daishinsha Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

// cf. http://www.w3.org/TR/DOM-Level-3-Events-key/
const Keys = {
  Unidentified: "Unidentified",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  Home: "Home",
  End: "End",
  PageDown: "PageDown",
  PageUp: "PageUp",
  Escape: "Escape",
  Enter: "Enter",
  Space: " ",
};

// CAUTION: This function covers only part of common keys on a keyboard. Keys not covered by the implementation are identified as KeyboardEvent.key, KeyboardEvent.keyIdentifier, or "Unidentified".
function identifyKeyFromEvent(
  event: KeyboardEvent,
): (typeof Keys)[keyof typeof Keys] {
  const key = event.key;
  const keyIdentifier = (event as KeyboardEvent & { keyIdentifier: string })
    .keyIdentifier;
  const location = event.location;
  if (key === Keys.ArrowDown || key === "Down" || keyIdentifier === "Down") {
    if (event.metaKey) {
      // Mac Cmd+Down -> End
      return Keys.End;
    }
    return Keys.ArrowDown;
  } else if (
    key === Keys.ArrowLeft ||
    key === "Left" ||
    keyIdentifier === "Left"
  ) {
    return Keys.ArrowLeft;
  } else if (
    key === Keys.ArrowRight ||
    key === "Right" ||
    keyIdentifier === "Right"
  ) {
    return Keys.ArrowRight;
  } else if (key === Keys.ArrowUp || key === "Up" || keyIdentifier === "Up") {
    if (event.metaKey) {
      // Mac Cmd+Up -> Home
      return Keys.Home;
    }
    return Keys.ArrowUp;
  } else if (
    key === Keys.Escape ||
    key === "Esc" ||
    keyIdentifier === "U+001B"
  ) {
    return Keys.Escape;
  } else if (key === Keys.Enter || keyIdentifier === "Enter") {
    return Keys.Enter;
  } else if (key === Keys.Space || keyIdentifier === "U+0020") {
    return Keys.Space;
  } else if (key === "0" || keyIdentifier === "U+0030") {
    return "0";
  } else if (
    key === "+" ||
    key === "Add" ||
    keyIdentifier === "U+002B" ||
    keyIdentifier === "U+00BB" ||
    (keyIdentifier === "U+004B" &&
      location ===
        KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) /* workaround for Chrome for Windows */
  ) {
    return "+";
  } else if (
    key === "-" ||
    key === "Subtract" ||
    keyIdentifier === "U+002D" ||
    keyIdentifier === "U+00BD" ||
    (keyIdentifier === "U+004D" &&
      location ===
        KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) /* workaround for Chrome for Windows */
  ) {
    return "-";
  } else {
    return key || keyIdentifier || Keys.Unidentified;
  }
}

export default {
  Keys,
  identifyKeyFromEvent,
};
