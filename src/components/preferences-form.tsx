"use client";

import { savePreferences } from "@/app/actions/preferences";
import type { Prefs } from "@/lib/preferences";
import { ActionForm, Checkbox, RadioGroup, SubmitButton } from "./form";

export function PreferencesForm({ prefs }: { prefs: Prefs }) {
  return (
    <ActionForm action={savePreferences} label="Хүртээмжийн тохиргоо">
      <section aria-labelledby="pref-vision" className="card mb-6 p-5">
        <h2 id="pref-vision" className="mb-3 text-xl font-bold">Харах</h2>
        <RadioGroup
          name="fontSize"
          legend="Үсгийн хэмжээ"
          defaultValue={prefs.fontSize}
          options={[
            { value: "normal", label: "Энгийн" },
            { value: "large", label: "Том (≈120%)" },
            { value: "xlarge", label: "Маш том (≈140%)" },
          ]}
        />
        <Checkbox name="highContrast" label="Өндөр өнгөний ялгарал" hint="Хар, цагаан өнгө, тод хүрээ, доогуур зураастай холбоос." defaultChecked={prefs.highContrast} />
        <Checkbox name="underlineLinks" label="Бүх холбоосыг доогуур зураасаар тодруулах" defaultChecked={prefs.underlineLinks} />
        <Checkbox name="strongFocus" label="Фокусын хүрээг илүү тод, өргөн болгох" hint="Гараар шилжихэд одоо аль элемент дээр байгааг тод харуулна." defaultChecked={prefs.strongFocus} />
      </section>

      <section aria-labelledby="pref-motor" className="card mb-6 p-5">
        <h2 id="pref-motor" className="mb-3 text-xl font-bold">Хөдөлгөөн, удирдлага</h2>
        <Checkbox name="largeTargets" label="Том товчлуур" hint="Товч, холбоос, сонголтын талбайг томруулна (56 пиксел)." defaultChecked={prefs.largeTargets} />
        <Checkbox name="reduceMotion" label="Хөдөлгөөнт эффект багасгах" hint="Анимэйшн, гулсах эффектийг унтраана." defaultChecked={prefs.reduceMotion} />
        <Checkbox
          name="voiceInput"
          label="Дуу хоолойгоор хайхыг санал болгох"
          hint="Таны хөтөч дэмждэг үед л ажиллана (жишээ нь Chrome). Дууг хөтчийн үйлчилгээ боловсруулна."
          defaultChecked={prefs.voiceInput}
        />
      </section>

      <section aria-labelledby="pref-content" className="card mb-6 p-5">
        <h2 id="pref-content" className="mb-3 text-xl font-bold">Мэдээлэл, контент</h2>
        <Checkbox name="screenReaderMode" label="Дэлгэц уншигчид зориулсан горим" hint="Бүтээгдэхүүний бүх хэсгийг нээлттэй харуулж, нэмэлт товшилт шаардахгүй." defaultChecked={prefs.screenReaderMode} />
        <Checkbox name="simpleLanguage" label="Энгийн хэллэгтэй тайлбар" hint="Боломжтой үед товч, энгийн тайлбарыг эхэнд харуулна." defaultChecked={prefs.simpleLanguage} />
        <RadioGroup
          name="contentFormat"
          legend="Мэдээллийг ямар хэлбэрээр авахыг илүүд үзэх вэ?"
          defaultValue={prefs.contentFormat}
          options={[
            { value: "text", label: "Бичвэр" },
            { value: "text_simple", label: "Энгийн, товч бичвэр" },
            { value: "text_with_video", label: "Бичвэр + хадмалтай видео (байгаа үед)" },
          ]}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText="Хадгалж байна…">Тохиргоо хадгалах</SubmitButton>
        <button type="submit" name="reset" value="1" className="btn btn-secondary">Анхны байдалд буцаах</button>
      </div>
    </ActionForm>
  );
}
