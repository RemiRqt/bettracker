import { describe, expect, it } from "vitest";
import { cn } from "./utils";

// cn maison (tailwind-merge pesait 8 Ko gzip par écran) : la dernière classe d'un même groupe gagne.
describe("cn", () => {
  it("assemble et ignore les valeurs vides (comme clsx)", () => {
    expect(cn("a", false, null, undefined, "b", { c: true, d: false })).toBe("a b c");
  });
  it("tailles : la dernière gagne, par propriété", () => {
    expect(cn("h-8 w-4 size-8", "h-11 size-11")).toBe("size-11"); // size couvre h et w
    expect(cn("min-h-9", "min-h-11 h-14")).toBe("min-h-11 h-14");
  });
  it("espacements : px et py sont distincts de p", () => {
    expect(cn("px-2.5 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("gap-1.5", "gap-2")).toBe("gap-2");
  });
  it("texte : taille et couleur sont deux groupes", () => {
    expect(cn("text-sm text-foreground", "text-base")).toBe("text-foreground text-base");
    expect(cn("text-sm text-foreground", "text-muted-foreground")).toBe("text-sm text-muted-foreground");
    expect(cn("text-base", "text-lg")).toBe("text-lg");
  });
  it("bordures : épaisseur et couleur sont deux groupes", () => {
    expect(cn("border border-input", "border-primary")).toBe("border border-primary");
    expect(cn("border", "border-2")).toBe("border-2");
  });
  it("police : graisse et famille sont deux groupes", () => {
    expect(cn("font-medium font-sans", "font-semibold")).toBe("font-sans font-semibold");
  });
  it("arrondis, fonds, ombres, affichage", () => {
    expect(cn("rounded-lg bg-card shadow-sm flex", "rounded-xl bg-muted shadow-lg grid")).toBe("rounded-xl bg-muted shadow-lg grid");
    expect(cn("rounded-t-3xl rounded-lg", "rounded-t-xl")).toBe("rounded-lg rounded-t-xl");
  });
  it("les variantes forment leur propre groupe", () => {
    expect(cn("h-9 md:h-8 hover:bg-muted", "h-11 hover:bg-accent")).toBe("md:h-8 h-11 hover:bg-accent");
  });
  it("l'opacité d'une couleur reste dans le groupe de la couleur", () => {
    expect(cn("bg-background/90", "bg-card")).toBe("bg-card");
  });
  it("anneaux et ombres : largeur et couleur sont deux groupes (focus visible)", () => {
    expect(cn("focus-visible:ring-3 focus-visible:ring-ring/50")).toBe("focus-visible:ring-3 focus-visible:ring-ring/50");
    expect(cn("ring-1 ring-foreground/10")).toBe("ring-1 ring-foreground/10");
    expect(cn("ring-1", "ring-2")).toBe("ring-2");
    expect(cn("shadow-sm shadow-primary/20", "shadow-lg")).toBe("shadow-primary/20 shadow-lg");
  });
  it("inset-x, inset-y et inset sont distincts", () => {
    expect(cn("after:-inset-x-3 after:-inset-y-2")).toBe("after:-inset-x-3 after:-inset-y-2");
  });
  it("alignement, style de bordure et bg-clip ne sont pas des couleurs", () => {
    expect(cn("text-left", "text-primary")).toBe("text-left text-primary");
    expect(cn("border border-dashed border-border")).toBe("border border-dashed border-border");
    expect(cn("bg-clip-padding bg-primary")).toBe("bg-clip-padding bg-primary");
    expect(cn("border-dashed", "border-solid")).toBe("border-solid");
  });
  it("un raccourci posé après remplace les valeurs plus précises (p remplace py)", () => {
    expect(cn("flex gap-6 py-6", "p-4")).toBe("flex gap-6 p-4");
    expect(cn("px-2 pt-1", "p-0")).toBe("p-0");
    expect(cn("mt-2 mx-1", "m-0")).toBe("m-0");
    expect(cn("h-8 w-8", "size-11")).toBe("size-11");
    expect(cn("gap-x-2", "gap-4")).toBe("gap-4");
    expect(cn("rounded-t-xl", "rounded-lg")).toBe("rounded-lg");
    expect(cn("p-4", "pt-0")).toBe("p-4 pt-0");
  });
  it("field-sizing : la dernière gagne (zone de texte à nombre de lignes fixe)", () => {
    expect(cn("field-sizing-content min-h-16", "field-sizing-fixed")).toBe("min-h-16 field-sizing-fixed");
  });
});
