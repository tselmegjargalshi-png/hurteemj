"use client";

import { useEffect, useRef, useState } from "react";

type SR = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

/**
 * Дуу хоолойгоор хайх — ТУСЛАХ сонголт. Хөтөч Web Speech API дэмждэг үед л харагдана.
 * Анхаар: Chrome зэрэг хөтөч дууг өөрийн серверт боловсруулдаг. Монгол хэлний таних чанар хөтчөөс хамаарна.
 */
export function VoiceSearch({ inputId }: { inputId: string }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  if (!supported) return null;

  function start() {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "mn-MN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) {
        input.value = text;
        input.focus();
      }
      setMessage(text ? `Таны хэлсэн: "${text}". Хайх товчийг дарж хайна уу.` : "Дуу танигдсангүй. Дахин оролдоно уу.");
    };
    rec.onerror = (e) => {
      setMessage(
        e.error === "not-allowed"
          ? "Микрофон ашиглах зөвшөөрөл олгогдоогүй байна. Хөтчийн тохиргооноос зөвшөөрнө үү."
          : "Дуу таних үед алдаа гарлаа. Бичиж хайна уу.",
      );
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setMessage("Сонсож байна. Хайх үгээ хэлнэ үү.");
    setListening(true);
    rec.start();
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => (listening ? recRef.current?.stop() : start())}
        aria-pressed={listening}
      >
        <span aria-hidden="true">🎤</span>
        {listening ? "Сонсохыг зогсоох" : "Дуугаар хайх"}
      </button>
      <p role="status" aria-live="polite" className="basis-full text-sm text-muted">
        {message}
      </p>
    </>
  );
}
