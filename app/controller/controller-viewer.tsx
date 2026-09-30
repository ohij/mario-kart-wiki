"use client";

import { useEffect, useState } from "react";

type ControllerState = { connected: boolean; id: string; buttons: number[]; axes: number[] };
const EMPTY_STATE: ControllerState = { connected: false, id: "", buttons: [], axes: [] };

function pressed(state: ControllerState, index: number) {
  return (state.buttons[index] ?? 0) > 0.15;
}

function Button({ label, active, className = "" }: { label: string; active: boolean; className?: string }) {
  return <span className={`controller-button ${active ? "is-active" : ""} ${className}`}>{label}</span>;
}

function Stick({ x, y, active, label }: { x: number; y: number; active: boolean; label: string }) {
  return <div className={`controller-stick ${active ? "is-active" : ""}`} aria-label={`${label} stick`}>
    <span style={{ transform: `translate(${Math.round(x * 28)}px, ${Math.round(y * 28)}px)` }} />
    <small>{label}</small>
  </div>;
}

export default function ControllerViewer({ overlay = false }: { overlay?: boolean }) {
  const [controller, setController] = useState<ControllerState>(EMPTY_STATE);
  const [nintendoLayout, setNintendoLayout] = useState(true);

  useEffect(() => {
    let frame = 0;
    const poll = () => {
      const gamepads = navigator.getGamepads?.() ?? [];
      const gamepad = Array.from(gamepads).find((item): item is Gamepad => item !== null);
      setController(gamepad ? {
        connected: true,
        id: gamepad.id,
        buttons: gamepad.buttons.map((button) => button.value),
        axes: Array.from(gamepad.axes),
      } : EMPTY_STATE);
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);

  const face = nintendoLayout
    ? { bottom: "B", right: "A", left: "Y", top: "X" }
    : { bottom: "A", right: "B", left: "X", top: "Y" };

  return <main className={`controller-viewer ${overlay ? "controller-overlay" : ""}`}>
    {!overlay && <header className="controller-header">
      <div><span className="section-label">SWITCH 2 CONNECT</span><h1>Joy-Con 2 Controller Viewer</h1><p>Switch2Connect가 만든 가상 게임패드 입력을 실시간으로 표시합니다.</p></div>
      <button type="button" className="controller-layout-toggle" onClick={() => setNintendoLayout((value) => !value)}>{nintendoLayout ? "Nintendo" : "Xbox"} 레이아웃</button>
    </header>}

    {!controller.connected && !overlay && <section className="controller-connect-help" role="status"><strong>컨트롤러를 기다리는 중</strong><p>Switch2Connect에서 Joy-Con 2를 연결하고 Xbox 또는 PlayStation 가상 컨트롤러 모드를 선택한 뒤, 아무 버튼이나 눌러 주세요.</p></section>}

    <section className="controller-shell" aria-label="Live controller input">
      <div className="controller-status" aria-live="polite"><span className={controller.connected ? "controller-status-dot online" : "controller-status-dot"} />{controller.connected ? "LIVE INPUT" : "WAITING FOR INPUT"}</div>
      <div className="controller-shoulders"><Button label="L" active={pressed(controller, 4)} /><Button label="ZL" active={pressed(controller, 6)} /><Button label="ZR" active={pressed(controller, 7)} /><Button label="R" active={pressed(controller, 5)} /></div>
      <div className="controller-body">
        <div className="controller-left-controls">
          <div className="controller-dpad" aria-label="D-pad"><Button label="▲" active={pressed(controller, 12)} className="dpad-up" /><Button label="◀" active={pressed(controller, 14)} className="dpad-left" /><Button label="▶" active={pressed(controller, 15)} className="dpad-right" /><Button label="▼" active={pressed(controller, 13)} className="dpad-down" /></div>
          <Stick x={controller.axes[0] ?? 0} y={controller.axes[1] ?? 0} active={pressed(controller, 10)} label="L" />
        </div>
        <div className="controller-center-controls"><Button label="−" active={pressed(controller, 8)} /><Button label="＋" active={pressed(controller, 9)} /><div className="controller-live-label">JOY-CON 2</div><Button label="□" active={pressed(controller, 17)} className="controller-capture" /><Button label="C" active={pressed(controller, 18)} /></div>
        <div className="controller-right-controls">
          <div className="controller-face-buttons" aria-label="Face buttons"><Button label={face.top} active={pressed(controller, 3)} className="face-top" /><Button label={face.left} active={pressed(controller, 2)} className="face-left" /><Button label={face.right} active={pressed(controller, 1)} className="face-right" /><Button label={face.bottom} active={pressed(controller, 0)} className="face-bottom" /></div>
          <Stick x={controller.axes[2] ?? 0} y={controller.axes[3] ?? 0} active={pressed(controller, 11)} label="R" />
        </div>
      </div>
    </section>
    {!overlay && <footer className="controller-footer"><span>{controller.connected ? controller.id : "브라우저에서 감지한 첫 번째 게임패드를 사용합니다."}</span><span>OBS는 이 창을 윈도우 캡처로 추가하세요.</span></footer>}
  </main>;
}
