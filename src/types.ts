/**
 * Modello Non Conformità (NC)
 * Specifica la struttura dati equivalente alla classe Python fornita dall'utente.
 */
export interface NonConformita {
  id: string; // Identificativo unico utile in React
  commessa: string;
  cliente: string;
  codice_disegno: string;
  tipo_nc: "Interna" | "Cliente" | "Fornitore";
  data_apertura: string; // formato YYYY-MM-DD
  data_chiusura: string; // formato YYYY-MM-DD o vuoto
  reparto: string; // Reparto di competenza (es. "CNC", "Taglio", "Collaudo", "Ufficio T.")
  causa: string;
  costo: number;
  persona: string;
  responsabile: string;
  note?: string; // Spiegazione di cosa è successo
}

// Reparti predefiniti consigliati, l'utente può comunque aggiungerne o scriverli a mano
export const REPARTI_PREDEFINITI = [
  "CNC",
  "Taglio",
  "Collaudo",
  "Ufficio T.",
  "Montaggio",
  "Piegatura"
];

// Cause comuni predefinite
export const CAUSE_PREDEFINITE = [
  "Errore operatore",
  "Usura utensile",
  "Specifiche disegno errate",
  "Materiale grezzo difettoso",
  "Errore di programmazione CAM",
  "Incuria manutenzione",
  "Imballaggio inadeguato",
  "Altro"
];

// Mesi tradotti
export const MESI_LIST = [
  { id: "01", nome: "GEN" },
  { id: "02", nome: "FEB" },
  { id: "03", nome: "MAR" },
  { id: "04", nome: "APR" },
  { id: "05", nome: "MAG" },
  { id: "06", nome: "GIU" },
  { id: "07", nome: "LUG" },
  { id: "08", nome: "AGO" },
  { id: "09", nome: "SET" },
  { id: "10", nome: "OTT" },
  { id: "11", nome: "NOV" },
  { id: "12", nome: "DIC" }
];
