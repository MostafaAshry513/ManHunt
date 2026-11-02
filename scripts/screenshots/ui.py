#!/usr/bin/env python3
"""Minimal uiautomator helper used by capture-premium.sh.

Compose exposes semantics (text + content descriptions) to the accessibility tree, which
uiautomator dumps as XML. That is enough to locate and tap every element the capture flow
needs without hard-coding screen coordinates.

A needle is a `|`-separated list of alternatives, each one of:
    text=Sign in        contains this `text` attribute
    desc=Settings       contains this `content-desc` attribute
    res=home_create     contains this `resource-id` attribute (when the app exposes testTags)
    Sign in             contains it in `text` OR `content-desc` (most common)
Matching is case-insensitive; the smallest matching node is tapped.

Commands:
  wait "<needle>" [timeout_seconds]   poll until a node matches; exit 1 on timeout
  tap "<needle>" [timeout_seconds]    wait, then tap the smallest matching node
  wait-gone "<needle>" [timeout]      poll until no node matches
  dump                                print every node that has text/content-desc/resource-id
  text                                print all visible text (debugging)
"""

import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.environ.get("ADB", "adb")
DUMP_PATH = "/sdcard/manhunt-ui.xml"


def run(args):
    return subprocess.run([ADB, *args], capture_output=True, check=False)


def dump_xml():
    """uiautomator can race the window idle state right after a transition; retry."""
    last_error = None
    for _ in range(8):
        result = run(["shell", "uiautomator", "dump", DUMP_PATH])
        output = (result.stdout or b"") + (result.stderr or b"")
        if b"dumped" in output:
            cat = run(["exec-out", "cat", DUMP_PATH])
            text = cat.stdout or b""
            if text.strip().startswith(b"<?xml") or text.strip().startswith(b"<hierarchy"):
                return text
        last_error = output.decode("utf-8", "replace").strip()
        time.sleep(0.5)
    raise SystemExit(f"uiautomator dump failed: {last_error}")


def bounds_of(node):
    match = re.match(r"\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]", node.get("bounds", ""))
    if not match:
        return None
    x1, y1, x2, y2 = (int(value) for value in match.groups())
    return x1, y1, x2, y2


def screen_bounds():
    """Root hierarchy bounds, used to clamp tap-near offsets to the screen."""
    try:
        root = ET.fromstring(dump_xml())
    except SystemExit:
        return None
    node = root.find("node")
    return bounds_of(node) if node is not None else None


def matches(node, needle):
    """True when any `|` alternative matches this node."""
    for alternative in needle.split("|"):
        alternative = alternative.strip()
        if not alternative:
            continue
        if alternative.startswith("text="):
            if alternative[5:].lower() in (node.get("text") or "").lower():
                return True
        elif alternative.startswith("desc="):
            if alternative[5:].lower() in (node.get("content-desc") or "").lower():
                return True
        elif alternative.startswith("res="):
            if alternative[4:].lower() in (node.get("resource-id") or "").lower():
                return True
        else:
            lowered = alternative.lower()
            for value in (node.get("text") or "", node.get("content-desc") or ""):
                if lowered in value.lower():
                    return True
    return False


def find_nodes(needle):
    try:
        root = ET.fromstring(dump_xml())
    except ET.ParseError as error:
        raise SystemExit(f"could not parse UI dump: {error}")
    found = []
    for node in root.iter("node"):
        if matches(node, needle):
            box = bounds_of(node)
            if box:
                found.append((node, box))
    return found


def wait_for(needle, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            found = find_nodes(needle)
        except SystemExit:
            found = []
        if found:
            return found
        time.sleep(0.6)
    return []


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    command = sys.argv[1]

    if command == "wait":
        needle = sys.argv[2]
        timeout = float(sys.argv[3]) if len(sys.argv) > 3 else 30.0
        found = wait_for(needle, timeout)
        if not found:
            raise SystemExit(f"wait timed out: {needle!r} not found in {timeout:.0f}s")
        print(f"found {needle!r} at {found[0][1]}")
        return

    if command == "wait-gone":
        needle = sys.argv[2]
        timeout = float(sys.argv[3]) if len(sys.argv) > 3 else 30.0
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                if not find_nodes(needle):
                    print(f"{needle!r} is gone")
                    return
            except SystemExit:
                return
            time.sleep(0.6)
        raise SystemExit(f"wait-gone timed out: {needle!r} is still present")

    if command == "tap":
        needle = sys.argv[2]
        timeout = float(sys.argv[3]) if len(sys.argv) > 3 else 30.0
        found = wait_for(needle, timeout)
        if not found:
            raise SystemExit(f"tap failed: {needle!r} not found in {timeout:.0f}s")
        node, (x1, y1, x2, y2) = min(found, key=lambda item: (item[1][2] - item[1][0]) * (item[1][3] - item[1][1]))
        center_x, center_y = (x1 + x2) // 2, (y1 + y2) // 2
        tap = run(["shell", "input", "tap", str(center_x), str(center_y)])
        if tap.returncode != 0:
            raise SystemExit(f"adb input tap failed for {needle!r}")
        print(f"tapped {needle!r} at ({center_x},{center_y}) text={node.get('text')!r} desc={node.get('content-desc')!r}")
        return

    if command == "tap-near":
        # Tap a point offset from a matching label, e.g. the input box below "Hunt name".
        needle = sys.argv[2]
        offset_x = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        offset_y = int(sys.argv[4]) if len(sys.argv) > 4 else 90
        timeout = float(sys.argv[5]) if len(sys.argv) > 5 else 30.0
        found = wait_for(needle, timeout)
        if not found:
            raise SystemExit(f"tap-near failed: {needle!r} not found in {timeout:.0f}s")
        node, (x1, y1, x2, y2) = min(found, key=lambda item: (item[1][2] - item[1][0]) * (item[1][3] - item[1][1]))
        center_x = (x1 + x2) // 2 + offset_x
        center_y = (y1 + y2) // 2 + offset_y
        bounds = screen_bounds()
        if bounds:
            center_x = min(max(center_x, bounds[0] + 2), bounds[2] - 2)
            center_y = min(max(center_y, bounds[1] + 2), bounds[3] - 2)
        tap = run(["shell", "input", "tap", str(center_x), str(center_y)])
        if tap.returncode != 0:
            raise SystemExit(f"adb input tap failed for {needle!r}")
        print(
            f"tapped near {needle!r} at ({center_x},{center_y}) "
            f"node={node.get('text')!r} desc={node.get('content-desc')!r}"
        )
        return

    if command == "tap-edit":
        # Tap the Nth text field; Compose exposes BasicTextField as android.widget.EditText.
        index = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        timeout = float(sys.argv[3]) if len(sys.argv) > 3 else 30.0
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                root = ET.fromstring(dump_xml())
            except SystemExit:
                time.sleep(0.6)
                continue
            edits = [
                (node, bounds_of(node))
                for node in root.iter("node")
                if "EditText" in (node.get("class") or "")
            ]
            edits = [(node, box) for node, box in edits if box]
            if len(edits) > index:
                node, (x1, y1, x2, y2) = edits[index]
                center_x, center_y = (x1 + x2) // 2, (y1 + y2) // 2
                tap = run(["shell", "input", "tap", str(center_x), str(center_y)])
                if tap.returncode != 0:
                    raise SystemExit(f"adb input tap failed for text field {index}")
                print(
                    f"tapped text field {index} at ({center_x},{center_y}) "
                    f"of {len(edits)} fields, text={node.get('text')!r}"
                )
                return
            time.sleep(0.6)
        raise SystemExit(f"tap-edit {index} failed: no text field found in {timeout:.0f}s")

    if command == "dump":
        try:
            root = ET.fromstring(dump_xml())
        except ET.ParseError as error:
            raise SystemExit(f"could not parse UI dump: {error}")
        for node in root.iter("node"):
            text = node.get("text") or ""
            desc = node.get("content-desc") or ""
            res = node.get("resource-id") or ""
            if text or desc or res:
                print(
                    f"{node.get('class', '?').split('.')[-1]:<24} bounds={node.get('bounds', ''):<26} "
                    f"text={text!r} desc={desc!r} res={res!r}"
                )
        return

    if command == "text":
        try:
            root = ET.fromstring(dump_xml())
        except ET.ParseError as error:
            raise SystemExit(f"could not parse UI dump: {error}")
        for node in root.iter("node"):
            text = node.get("text") or ""
            if text:
                print(text)
        return

    raise SystemExit(f"unknown command: {command}")


if __name__ == "__main__":
    main()
