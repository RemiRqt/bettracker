"use client";

type Props = {
  options: readonly string[];
  // Libellés sélectionnés, dans l'ordre (l'ordre sert au classement).
  selection: readonly string[];
  surChoix: (option: string) => void;
  classement?: boolean;
  libelle?: string;
};

// Sélecteur maison en puces : remplace listes déroulantes, boutons radio et cases à cocher.
export function Puces({ options, selection, surChoix, classement, libelle }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={libelle}>
      {options.map((option) => {
        const rang = selection.indexOf(option);
        const actif = rang >= 0;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={actif}
            onClick={() => surChoix(option)}
            className={`min-h-10 rounded-full border px-3.5 py-2 text-left text-[15px] transition-colors ${
              actif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent text-foreground"
            }`}
          >
            {classement && actif && <span className="mr-1.5 font-bold">{rang + 1}</span>}
            {option}
          </button>
        );
      })}
    </div>
  );
}
