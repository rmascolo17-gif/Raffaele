import React, { useState, useEffect, useMemo } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  BarChart3, 
  Table2, 
  FileText, 
  AlertOctagon, 
  TrendingUp, 
  Coins, 
  Calendar, 
  Briefcase, 
  User, 
  Settings, 
  Tag, 
  Layers, 
  Search, 
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Users,
  AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import ReactMarkdown from "react-markdown";

import { NonConformita, REPARTI_PREDEFINITI, CAUSE_PREDEFINITE, MESI_LIST } from "./types";
import { SEED_NON_CONFORMITA } from "./mockData";

export default function App() {
  // --- STATE ---
  const [ncs, setNcs] = useState<NonConformita[]>(() => {
    const saved = localStorage.getItem("azienda_nc_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Errore nel caricamento dei dati salvati", e);
      }
    }
    return SEED_NON_CONFORMITA;
  });

  // Salva stato automaticamente su localStorage
  useEffect(() => {
    localStorage.setItem("azienda_nc_data", JSON.stringify(ncs));
  }, [ncs]);

  // Filtri attivi
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" o "01"-"12"

  // Scheda attiva della dashboard
  const [activeTab, setActiveTab] = useState<"charts" | "tables" | "ai" | "register" | "trends" | "repetition">("charts");

  // Stati Analisi Ripetitività (Errori & Personale)
  const [repetitionMonth, setRepetitionMonth] = useState<string>("01");
  const [repetitionMode, setRepetitionMode] = useState<"mensile" | "annuale">("mensile");

  // Form Nuovo Inserimento
  const [formCommessa, setFormCommessa] = useState("");
  const [formCliente, setFormCliente] = useState("");
  const [formCodiceDisegno, setFormCodiceDisegno] = useState("");
  const [formTipoNc, setFormTipoNc] = useState<"Interna" | "Cliente" | "Fornitore">("Interna");
  const [formDataApertura, setFormDataApertura] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [formDataChiusura, setFormDataChiusura] = useState("");
  
  // Stato per gestione di molteplici reparti per la medesima NC con relativi costi
  const [formReparti, setFormReparti] = useState<{ id: string; value: string; isCustom: boolean; costo: number }[]>([
    { id: "dept-init", value: REPARTI_PREDEFINITI[0], isCustom: false, costo: 0 }
  ]);

  const handleAddRepartoField = () => {
    setFormReparti(prev => [
      ...prev,
      { id: "dept-" + Date.now() + "-" + Math.random(), value: REPARTI_PREDEFINITI[0], isCustom: false, costo: 0 }
    ]);
  };

  const handleRemoveRepartoField = (id: string) => {
    if (formReparti.length > 1) {
      setFormReparti(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleUpdateRepartoField = (id: string, updates: Partial<{ value: string; isCustom: boolean; costo: number }>) => {
    setFormReparti(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Calcolo automatico del costo totale nel form di aggiunta in base ai singoli reparti
  const calculatedTotalFormCosto = useMemo(() => {
    return formReparti.reduce((sum, item) => sum + (Number(item.costo) || 0), 0);
  }, [formReparti]);

  const [formCausa, setFormCausa] = useState(CAUSE_PREDEFINITE[0]);
  const [formCausaCustomOpen, setFormCausaCustomOpen] = useState(false);
  const [formCausaCustomValue, setFormCausaCustomValue] = useState("");
  const [formCosto, setFormCosto] = useState<number>(0);
  const [formPersona, setFormPersona] = useState("");
  const [formResponsabile, setFormResponsabile] = useState("");
  const [formNote, setFormNote] = useState("");

  const [formMessage, setFormMessage] = useState<{ status: "success" | "error"; text: string } | null>(null);

  // Ricerca nel registro
  const [searchTerm, setSearchTerm] = useState("");

  // Stato Modifica Non Conformità
  const [editingNc, setEditingNc] = useState<NonConformita | null>(null);
  const [ncToDelete, setNcToDelete] = useState<string | null>(null);

  // Visibilità delle serie temporali dei trend
  const [showTrendInterna, setShowTrendInterna] = useState(true);
  const [showTrendCliente, setShowTrendCliente] = useState(true);
  const [showTrendFornitore, setShowTrendFornitore] = useState(true);
  const [showTrendTotale, setShowTrendTotale] = useState(true);

  // Visibilità del Numero e del Costo nel Grafico per Reparto
  const [showDeptCount, setShowDeptCount] = useState(true);
  const [showDeptCost, setShowDeptCost] = useState(true);

  // Stato Report Gemini
  const [aiReport, setAiReport] = useState<string>("");
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiMessageIndex, setAiMessageIndex] = useState(0);

  // Elenco dei messaggi rassicuranti da mostrare durante il caricamento
  const reassuringMessages = [
    "Analisi della distribuzione delle non conformità per reparto...",
    "Calcolo dell'impatto economico e frequenza delle anomalie...",
    "Correlazione tra cause radice ed errori di reparto...",
    "Filtro dei dati sul periodo selezionato...",
    "Elaborazione delle raccomandazioni e del Quality Action Plan...",
    "Gemini sta redigendo la sintesi finale e strutturando il report..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (aiReportLoading) {
      interval = setInterval(() => {
        setAiMessageIndex((prev) => (prev + 1) % reassuringMessages.length);
      }, 5000);
    } else {
      setAiMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [aiReportLoading]);

  // Lista di tutti gli anni unici presenti per il filtro
  const availableYears = useMemo(() => {
    const years = ncs.map(nc => nc.data_apertura.substring(0, 4));
    const uniqueYears = Array.from(new Set(years)).filter(y => y.length === 4);
    if (!uniqueYears.includes("2026")) {
      uniqueYears.push("2026");
    }
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, [ncs]);

  // Helper per scompattare molteplici reparti da un record di non conformità
  const getReparti = (nc: NonConformita): string[] => {
    if (!nc.reparto) return [];
    return nc.reparto.split(",").map(r => r.trim()).filter(Boolean);
  };

  // Helper per ottenere il costo specifico associato a un reparto per una NC
  const getRepartoCosto = (nc: NonConformita, dept: string): number => {
    if (nc.reparti_costi && nc.reparti_costi[dept] !== undefined) {
      return Number(nc.reparti_costi[dept]) || 0;
    }
    // Fallback automatico per i dati storici
    const reps = getReparti(nc);
    if (reps.includes(dept)) {
      if (reps.length <= 1) {
        return Number(nc.costo) || 0;
      }
      return Number((Number(nc.costo) || 0) / reps.length);
    }
    return 0;
  };

  // Elenco completo e dinamico dei reparti esistenti nel DB
  const dynamicDepartments = useMemo(() => {
    const deptsInDb = ncs.flatMap(nc => getReparti(nc));
    const combined = [...new Set([...REPARTI_PREDEFINITI, ...deptsInDb])];
    return combined.filter(d => d && d.trim() !== "");
  }, [ncs]);

  // --- FILTRO RECORD ---
  const filteredNCs = useMemo(() => {
    return ncs.filter(nc => {
      // Filtro anno
      const year = nc.data_apertura.substring(0, 4);
      if (year !== selectedYear) return false;

      // Filtro mese
      if (selectedMonth !== "all") {
        const month = nc.data_apertura.substring(5, 7);
        if (month !== selectedMonth) return false;
      }

      return true;
    });
  }, [ncs, selectedYear, selectedMonth]);

  // --- CALCOLO KPI STATISTICI ---
  const kpis = useMemo(() => {
    let internaCount = 0;
    let internaCost = 0;
    let clienteCount = 0;
    let clienteCost = 0;
    let fornitoreCount = 0;
    let fornitoreCost = 0;

    filteredNCs.forEach(nc => {
      const costo = Number(nc.costo) || 0;
      if (nc.tipo_nc === "Interna") {
        internaCount++;
        internaCost += costo;
      } else if (nc.tipo_nc === "Cliente") {
        clienteCount++;
        clienteCost += costo;
      } else if (nc.tipo_nc === "Fornitore") {
        fornitoreCount++;
        fornitoreCost += costo;
      }
    });

    const totalCount = internaCount + clienteCount + fornitoreCount;
    const totalCost = internaCost + clienteCost + fornitoreCost;

    return {
      internaCount,
      internaCost,
      clienteCount,
      clienteCost,
      fornitoreCount,
      fornitoreCost,
      totalCount,
      totalCost
    };
  }, [filteredNCs]);

  // --- DATI PER GRAFICO SEMPLIFICATO ---
  const chartData = useMemo(() => {
    return dynamicDepartments.map(dept => {
      const deptNCs = filteredNCs.filter(nc => getReparti(nc).includes(dept));
      const count = deptNCs.length;
      const cost = deptNCs.reduce((sum, item) => sum + getRepartoCosto(item, dept), 0);
      return {
        name: dept,
        count: count,
        cost: Number(cost.toFixed(2))
      };
    }).filter(d => d.count > 0 || d.cost > 0); // mostra solo i reparti interessati per non affollare
  }, [filteredNCs, dynamicDepartments]);

  // --- TABELLA RIEPILOGATIVA MENSILE (INTERNA & CLIENTE) ---
  const monthlyReportData = useMemo(() => {
    let grandTotalInternaCount = 0;
    let grandTotalInternaCost = 0;
    let grandTotalClienteCount = 0;
    let grandTotalClienteCost = 0;

    const rows = MESI_LIST.map(m => {
      const monthNCs = ncs.filter(nc => {
        const ncYear = nc.data_apertura.substring(0, 4);
        const ncMonth = nc.data_apertura.substring(5, 7);
        return ncYear === selectedYear && ncMonth === m.id;
      });

      const interna = monthNCs.filter(nc => nc.tipo_nc === "Interna");
      const internaCount = interna.length;
      const internaCost = interna.reduce((sum, item) => sum + (Number(item.costo) || 0), 0);

      const cliente = monthNCs.filter(nc => nc.tipo_nc === "Cliente");
      const clienteCount = cliente.length;
      const clienteCost = cliente.reduce((sum, item) => sum + (Number(item.costo) || 0), 0);

      const combinedCount = internaCount + clienteCount;
      const combinedCost = internaCost + clienteCost;

      grandTotalInternaCount += internaCount;
      grandTotalInternaCost += internaCost;
      grandTotalClienteCount += clienteCount;
      grandTotalClienteCost += clienteCost;

      return {
        id: m.id,
        nome: m.nome,
        internaCount,
        internaCost,
        clienteCount,
        clienteCost,
        combinedCount,
        combinedCost
      };
    });

    const grandCombinedCount = grandTotalInternaCount + grandTotalClienteCount;
    const grandCombinedCost = grandTotalInternaCost + grandTotalClienteCost;

    return {
      rows,
      totals: {
        internaCount: grandTotalInternaCount,
        internaCost: grandTotalInternaCost,
        clienteCount: grandTotalClienteCount,
        clienteCost: grandTotalClienteCost,
        combinedCount: grandCombinedCount,
        combinedCost: grandCombinedCost
      }
    };
  }, [ncs, selectedYear]);

  // --- CONTROLLO CORRELAZIONE TREND MENSILI (NUMERO NC & COSTI) ---
  const trendsReportData = useMemo(() => {
    return MESI_LIST.map(m => {
      const monthNCs = ncs.filter(nc => {
        const ncYear = nc.data_apertura.substring(0, 4);
        const ncMonth = nc.data_apertura.substring(5, 7);
        return ncYear === selectedYear && ncMonth === m.id;
      });

      const interna = monthNCs.filter(nc => nc.tipo_nc === "Interna");
      const internaCount = interna.length;
      const internaCost = interna.reduce((sum, item) => sum + (Number(item.costo) || 0), 0);

      const cliente = monthNCs.filter(nc => nc.tipo_nc === "Cliente");
      const clienteCount = cliente.length;
      const clienteCost = cliente.reduce((sum, item) => sum + (Number(item.costo) || 0), 0);

      const fornitore = monthNCs.filter(nc => nc.tipo_nc === "Fornitore");
      const fornitoreCount = fornitore.length;
      const fornitoreCost = fornitore.reduce((sum, item) => sum + (Number(item.costo) || 0), 0);

      const totalCount = internaCount + clienteCount + fornitoreCount;
      const totalCost = internaCost + clienteCost + fornitoreCost;

      return {
        monthId: m.id,
        monthName: m.nome,
        internaCount,
        internaCost,
        clienteCount,
        clienteCost,
        fornitoreCount,
        fornitoreCost,
        totalCount,
        totalCost: Number(totalCost.toFixed(2))
      };
    });
  }, [ncs, selectedYear]);

  // --- STATISTICHE E FILTRI PER L'ANALISI DI RIPETITIVITÀ & OPERATORI ---
  const yearNCs = useMemo(() => {
    return ncs.filter(nc => nc.data_apertura.substring(0, 4) === selectedYear);
  }, [ncs, selectedYear]);

  // Record annuale delle cause/errori ripetitivi
  const annualErrorAnalysis = useMemo(() => {
    const counts: Record<string, { causa: string; count: number; totalCost: number; months: Set<string> }> = {};
    yearNCs.forEach(nc => {
      const uCausa = nc.causa?.trim() || "Altro";
      const monthStr = nc.data_apertura.substring(5, 7);
      const mItem = MESI_LIST.find(m => m.id === monthStr);
      const monthName = mItem ? mItem.nome : monthStr;
      
      if (!counts[uCausa]) {
        counts[uCausa] = { causa: uCausa, count: 0, totalCost: 0, months: new Set() };
      }
      counts[uCausa].count += 1;
      counts[uCausa].totalCost += (Number(nc.costo) || 0);
      counts[uCausa].months.add(monthName);
    });

    return Object.values(counts)
      .map(item => ({
        ...item,
        monthsFormatted: Array.from(item.months).join(", ")
      }))
      .sort((a, b) => b.count - a.count);
  }, [yearNCs]);

  // Record annuale delle performance e anomalie per operatore (personale)
  const annualPersonnelAnalysis = useMemo(() => {
    const counts: Record<string, { persona: string; count: number; totalCost: number; causes: Record<string, number> }> = {};
    yearNCs.forEach(nc => {
      const uPersona = nc.persona?.trim() || "N/D";
      const uCausa = nc.causa?.trim() || "Altro";
      
      if (!counts[uPersona]) {
        counts[uPersona] = { persona: uPersona, count: 0, totalCost: 0, causes: {} };
      }
      counts[uPersona].count += 1;
      counts[uPersona].totalCost += (Number(nc.costo) || 0);
      counts[uPersona].causes[uCausa] = (counts[uPersona].causes[uCausa] || 0) + 1;
    });

    return Object.values(counts)
      .map(p => {
        let topCausa = "Nessuna";
        let maxCount = 0;
        Object.entries(p.causes).forEach(([cause, cnt]) => {
          if (cnt > maxCount) {
            maxCount = cnt;
            topCausa = cause;
          }
        });
        return {
          ...p,
          topCausa,
          topCausaCount: maxCount
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [yearNCs]);

  // Non conformità filtrate per il mese dell'analisi ripetitività
  const monthNCs = useMemo(() => {
    return yearNCs.filter(nc => nc.data_apertura.substring(5, 7) === repetitionMonth);
  }, [yearNCs, repetitionMonth]);

  // Record mensile delle cause / anomalie con flag di ripetitività (>1)
  const monthlyErrorAnalysis = useMemo(() => {
    const counts: Record<string, { causa: string; count: number; totalCost: number }> = {};
    monthNCs.forEach(nc => {
      const uCausa = nc.causa?.trim() || "Altro";
      if (!counts[uCausa]) {
        counts[uCausa] = { causa: uCausa, count: 0, totalCost: 0 };
      }
      counts[uCausa].count += 1;
      counts[uCausa].totalCost += (Number(nc.costo) || 0);
    });

    return Object.values(counts)
      .map(c => ({
        ...c,
        isRepetitive: c.count > 1
      }))
      .sort((a, b) => b.count - a.count);
  }, [monthNCs]);

  // Record mensile degli operatori con anomalie commesse e flag ripetitività
  const monthlyPersonnelAnalysis = useMemo(() => {
    const counts: Record<string, { persona: string; count: number; totalCost: number; causes: Record<string, number> }> = {};
    monthNCs.forEach(nc => {
      const uPersona = nc.persona?.trim() || "N/D";
      const uCausa = nc.causa?.trim() || "Altro";
      
      if (!counts[uPersona]) {
        counts[uPersona] = { persona: uPersona, count: 0, totalCost: 0, causes: {} };
      }
      counts[uPersona].count += 1;
      counts[uPersona].totalCost += (Number(nc.costo) || 0);
      counts[uPersona].causes[uCausa] = (counts[uPersona].causes[uCausa] || 0) + 1;
    });

    return Object.values(counts)
      .map(p => {
        let topCausa = "Nessuna";
        let maxCount = 0;
        Object.entries(p.causes).forEach(([cause, cnt]) => {
          if (cnt > maxCount) {
            maxCount = cnt;
            topCausa = cause;
          }
        });
        return {
          ...p,
          topCausa,
          topCausaCount: maxCount,
          isRepetitive: p.count > 1
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [monthNCs]);

  // --- MATRICE REPARTI x MESI ---
  const departmentsMatrix = useMemo(() => {
    // Colonne: i reparti
    const columns = dynamicDepartments;

    // Totale mensile per reparto accumulato
    const repartiTotals: Record<string, { count: number; cost: number }> = {};
    columns.forEach(dept => {
      repartiTotals[dept] = { count: 0, cost: 0 };
    });

    let matrixGrandTotalCount = 0;
    let matrixGrandTotalCost = 0;

    // Righe: i mesi
    const rows = MESI_LIST.map(m => {
      const monthNCs = ncs.filter(nc => {
        const ncYear = nc.data_apertura.substring(0, 4);
        const ncMonth = nc.data_apertura.substring(5, 7);
        return ncYear === selectedYear && ncMonth === m.id;
      });

      let monthTotalCount = 0;
      let monthTotalCost = 0;

      const cellDetails: Record<string, { count: number; cost: number }> = {};

      columns.forEach(dept => {
        const deptAndMonthNCs = monthNCs.filter(nc => getReparti(nc).includes(dept));
        const count = deptAndMonthNCs.length;
        const cost = deptAndMonthNCs.reduce((sum, item) => sum + getRepartoCosto(item, dept), 0);

        cellDetails[dept] = { count, cost };

        // Accumula per reparto totale (fondo colonna)
        repartiTotals[dept].count += count;
        repartiTotals[dept].cost += cost;

        monthTotalCount += count;
        monthTotalCost += cost;
      });

      matrixGrandTotalCount += monthTotalCount;
      matrixGrandTotalCost += monthTotalCost;

      return {
        id: m.id,
        nome: m.nome,
        cells: cellDetails,
        totalCount: monthTotalCount,
        totalCost: monthTotalCost
      };
    });

    return {
      columns,
      rows,
      repartiTotals,
      grandTotals: {
        count: matrixGrandTotalCount,
        cost: matrixGrandTotalCost
      }
    };
  }, [ncs, selectedYear, dynamicDepartments]);

  // --- REGISTRO & RICERCA COMPLESSIVA ---
  const searchedNCs = useMemo(() => {
    if (!searchTerm.trim()) return ncs;
    const term = searchTerm.toLowerCase();
    return ncs.filter(nc => {
      return (
        nc.commessa.toLowerCase().includes(term) ||
        nc.cliente.toLowerCase().includes(term) ||
        nc.codice_disegno.toLowerCase().includes(term) ||
        nc.reparto.toLowerCase().includes(term) ||
        nc.causa.toLowerCase().includes(term) ||
        nc.persona.toLowerCase().includes(term) ||
        nc.responsabile.toLowerCase().includes(term) ||
        nc.tipo_nc.toLowerCase().includes(term) ||
        (nc.note || "").toLowerCase().includes(term)
      );
    });
  }, [ncs, searchTerm]);

  // --- GESTIONE NUOVO INSERIMENTO NC ---
  const handleAddNewNC = (e: React.FormEvent) => {
    e.preventDefault();

    const finalRepartiList = formReparti
      .map(item => item.value.trim())
      .filter(val => val !== "");
    const finalCausa = formCausaCustomOpen ? formCausaCustomValue.trim() : formCausa;

    // Validazioni del Modello NC richiesto
    if (!formCommessa.trim()) {
      setFormMessage({ status: "error", text: "Commessa obbligatoria." });
      return;
    }
    if (!formCliente.trim()) {
      setFormMessage({ status: "error", text: "Cliente obbligatorio." });
      return;
    }
    if (!formCodiceDisegno.trim()) {
      setFormMessage({ status: "error", text: "Codice disegno obbligatorio." });
      return;
    }
    if (finalRepartiList.length === 0) {
      setFormMessage({ status: "error", text: "Devi specificare almeno un reparto." });
      return;
    }
    if (!finalCausa) {
      setFormMessage({ status: "error", text: "Devi specificare la causa di non conformità." });
      return;
    }

    const repartiCostiMap: Record<string, number> = {};
    formReparti.forEach(item => {
      const name = item.value.trim();
      if (name) {
        repartiCostiMap[name] = Number(item.costo) || 0;
      }
    });

    const newNC: NonConformita = {
      id: "nc-dyn-" + Date.now(),
      commessa: formCommessa.trim(),
      cliente: formCliente.trim(),
      codice_disegno: formCodiceDisegno.trim(),
      tipo_nc: formTipoNc,
      data_apertura: formDataApertura,
      data_chiusura: formDataChiusura || "",
      reparto: finalRepartiList.join(", "),
      causa: finalCausa,
      costo: calculatedTotalFormCosto,
      persona: formPersona.trim() || "N/D",
      responsabile: formResponsabile.trim() || "N/D",
      reparti_costi: repartiCostiMap,
      note: formNote.trim()
    };

    setNcs([newNC, ...ncs]);

    // Reset Form a valori puliti
    setFormCommessa("");
    setFormCliente("");
    setFormCodiceDisegno("");
    setFormCosto(0);
    setFormPersona("");
    setFormResponsabile("");
    setFormNote("");
    setFormDataChiusura("");
    setFormReparti([
      { id: "dept-reset-" + Date.now(), value: REPARTI_PREDEFINITI[0], isCustom: false, costo: 0 }
    ]);
    setFormCausaCustomOpen(false);
    setFormCausaCustomValue("");
    
    setFormMessage({ status: "success", text: "Non Conformità inserita con successo nel database!" });
    
    // Auto clear feedback dopo 5 secondi
    setTimeout(() => {
      setFormMessage(null);
    }, 5000);
  };

  // --- CANCELLA NC ---
  const handleDeleteNC = (id: string) => {
    setNcToDelete(id);
  };

  // --- SALVA MODIFICHE NC ---
  const handleUpdateNC = (updated: NonConformita) => {
    setNcs(prev => prev.map(nc => nc.id === updated.id ? updated : nc));
    setEditingNc(null);
  };

  // --- CHIAMATA GEMINI API SERVER-SIDE ---
  const handleGenerateAiReport = async () => {
    setAiReportLoading(true);
    setAiError("");
    setAiReport("");
    
    try {
      // Prepariamo dati strutturati da inviare all'API
      const payload = {
        year: selectedYear,
        month: selectedMonth,
        customPrompt: aiCustomPrompt,
        data: {
          summary: kpis,
          list: filteredNCs.map(nc => ({
            commessa: nc.commessa,
            cliente: nc.cliente,
            disegno: nc.codice_disegno,
            tipo: nc.tipo_nc,
            apertura: nc.data_apertura,
            reparto: nc.reparto,
            causa: nc.causa,
            costo: nc.costo,
            persona: nc.persona,
            responsabile: nc.responsabile
          }))
        }
      };

      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Errore sconosciuto nella risposta del server.");
      }

      const result = await response.json();
      setAiReport(result.report);
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || "Impossibile contattare il server per generare il report.");
    } finally {
      setAiReportLoading(false);
    }
  };

  // --- CUSTOM TOOLTIP GRAFICO RECHARTS ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs font-sans">
          <p className="font-bold text-slate-100 mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span className="text-slate-300">Quantità:</span>
              <span className="font-semibold text-white">{payload[0]?.value} NC</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
              <span className="text-slate-300">Imp. Economico:</span>
              <span className="font-semibold text-white">
                €{(payload[1]?.value || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- CUSTOM TOOLTIP GRAFICI TRENDS MENSILI ---
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 border border-slate-700 text-xs font-sans">
          <p className="font-bold text-slate-100 mb-2 border-b border-slate-700 pb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((p: any, idx: number) => (
              <p key={idx} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.stroke || p.color }}></span>
                  <span className="text-slate-300">{p.name || p.dataKey}:</span>
                </span>
                <span className="font-semibold text-white ml-2">
                  {p.name && (p.name.includes("Costo") || p.name.includes("€"))
                    ? `€${(p.value || 0).toLocaleString("it-IT", { maximumFractionDigits: 2 })}`
                    : `${p.value || 0} NC`}
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-16 flex flex-col justify-between">
      
      {/* HEADER PRINCIPALE */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/15 transition-all hover:scale-105 duration-200">
            <svg className="w-5.5 h-5.5 text-white drop-shadow-xs" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              {/* Piramide 3D rivolta verso l'alto */}
              <path d="M12 3L4 18L12 15.5Z" fill="rgba(255, 255, 255, 0.98)" />
              <path d="M12 3L20 18L12 15.5Z" fill="rgba(255, 255, 255, 0.72)" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-md sm:text-lg font-black tracking-wider bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent uppercase leading-none">
              CHRONO-RA
            </span>
            <span className="text-[9px] text-slate-400 font-extrabold tracking-widest uppercase mt-0.5">
              Quality Hub
            </span>
          </div>
        </div>
        
        <div className="flex gap-4 text-sm font-medium items-center">
          {/* BARRA FILTRI PRINCIPALE */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1.5 items-center">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Periodo:</span>
            </div>

            {/* Anno */}
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-200 rounded text-xs px-2 py-1 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Mese */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 rounded text-xs px-2 py-1 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Tutto l'anno</option>
              {MESI_LIST.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* --- KPI PRINCIPALI --- */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          {/* INTERNA */}
          <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">NC INTERNE</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono">{selectedYear}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-light tracking-tighter text-slate-900">{kpis.internaCount}</span>
              <span className="text-base text-slate-400">/ €{kpis.internaCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="h-1 bg-slate-100 w-full mt-4">
              <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${kpis.totalCount > 0 ? Math.min(100, (kpis.internaCount / kpis.totalCount) * 100) : 0}%` }}></div>
            </div>
          </div>

          {/* CLIENTE */}
          <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">NC CLIENTE</span>
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-mono">{selectedYear}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-light tracking-tighter text-slate-900">{kpis.clienteCount}</span>
              <span className="text-base text-slate-400">/ €{kpis.clienteCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="h-1 bg-slate-100 w-full mt-4">
              <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${kpis.totalCount > 0 ? Math.min(100, (kpis.clienteCount / kpis.totalCount) * 100) : 0}%` }}></div>
            </div>
          </div>

          {/* FORNITORE */}
          <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-400 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-purple-600 tracking-wider uppercase">NC FORNITORE</span>
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-mono">{selectedYear}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-light tracking-tighter text-slate-910 text-slate-900">{kpis.fornitoreCount}</span>
              <span className="text-base text-slate-400">/ €{kpis.fornitoreCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="h-1 bg-slate-100 w-full mt-4">
              <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${kpis.totalCount > 0 ? Math.min(100, (kpis.fornitoreCount / kpis.totalCount) * 100) : 0}%` }}></div>
            </div>
          </div>

          {/* TOTALE (STILE HIGH CONTRAST SLATE-900) */}
          <div className="bg-slate-900 border border-slate-900 p-5 flex flex-col justify-between text-white hover:bg-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">KPI TOTALE</span>
              <span className="text-xs bg-white text-slate-900 font-bold px-2 py-0.5 rounded">OVERALL</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold tracking-tighter text-white">{kpis.totalCount}</span>
              <span className="text-lg text-yellow-450 text-yellow-400 font-semibold uppercase font-mono">€{kpis.totalCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-3 font-mono">
              Costo medio per NC: €{kpis.totalCount > 0 ? (kpis.totalCost / kpis.totalCount).toLocaleString("it-IT", { maximumFractionDigits: 2 }) : "0,00"}
            </div>
          </div>

        </section>

        {/* --- SELETTORE TABS (DOCK DI NAVIGAZIONE A BILANCIAMENTO GEOMETRICO) --- */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-8 max-w-fit flex-wrap gap-1">
          
          <button
            onClick={() => setActiveTab("charts")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "charts"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("tables")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "tables"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            Inserimento Dati & Matrice
          </button>

          <button
            onClick={() => setActiveTab("register")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "register"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Registro NC
            <span className="bg-slate-200 text-slate-800 font-bold text-[10px] px-1.5 py-0.2 rounded-sm font-mono">{ncs.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("trends")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "trends"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Analisi Trend MoM
          </button>

          <button
            onClick={() => setActiveTab("repetition")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeTab === "repetition"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            Analisi Errori & Personale
          </button>

        </div>

        {/* --- CONTENUTI TAB --- */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: GRAFICI & INSERIMENTO DATI */}
          {activeTab === "charts" && (
            <motion.div
              key="charts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Grafico (Doppio asse) */}
              <div className="lg:col-span-2 bg-white p-6 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Riepilogo Costi & Frequenze per Reparto
                    </h3>
                    <p className="text-xs text-slate-400">
                      Rappresentazione a due assi: numero NC (Asse Sinistro, Blu) e Costo Totale (Asse Destro, Giallo)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs select-none">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showDeptCount}
                        onChange={(e) => setShowDeptCount(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Numero
                      </span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-amber-600 hover:text-amber-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showDeptCost}
                        onChange={(e) => setShowDeptCost(e.target.checked)}
                        className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Costo (€)
                      </span>
                    </label>
                  </div>
                </div>

                {chartData.length > 0 ? (
                  <div className="w-full h-80 md:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 25, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={11}
                          fontFamily="Inter, sans-serif"
                        />
                        {/* Asse sinistro: Quantità */}
                        {showDeptCount && (
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            stroke="#3b82f6" 
                            fontSize={11}
                            fontFamily="Inter, sans-serif"
                            tickLine={false}
                          />
                        )}
                        {/* Asse destro: Costo in valuta */}
                        {showDeptCost && (
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#eab308" 
                            fontSize={11}
                            fontFamily="Inter, sans-serif"
                            tickLine={false}
                            tickFormatter={(v) => `€${v}`}
                          />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
                        {showDeptCount && (
                          <Bar 
                            yAxisId="left" 
                            dataKey="count" 
                            fill="#3b82f6" 
                            name="Numero NC" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20}
                            label={{ position: 'top', fill: '#1e40af', fontSize: 10, fontWeight: 700 }}
                          />
                        )}
                        {showDeptCost && (
                          <Bar 
                            yAxisId="right" 
                            dataKey="cost" 
                            fill="#eab308" 
                            name="Costo NC (€)" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20}
                            label={{ position: 'top', fill: '#854d0e', fontSize: 10, fontWeight: 700, formatter: (v: any) => `€${Math.round(v).toLocaleString('it-IT')}` }}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Nessun dato da visualizzare</p>
                    <p className="text-xs text-slate-400 mt-1">Non ci sono record di non conformità per il periodo selezionato.</p>
                  </div>
                )}
              </div>

              {/* Form Inserimento Dati */}
              <div className="bg-white p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                      Nuova Non Conformità
                    </h3>
                    <p className="text-xs text-slate-400">Registra un evento aziendale NC</p>
                  </div>
                </div>

                {formMessage && (
                  <div className={`p-4 rounded-xl text-xs mb-4 flex items-start gap-2.5 ${
                    formMessage.status === "success" 
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 transition-all" />
                    <p>{formMessage.text}</p>
                  </div>
                )}

                <form onSubmit={handleAddNewNC} className="space-y-4">
                  
                  {/* Commessa & Cliente */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 label mb-1">
                        Commessa *
                      </label>
                      <input 
                        type="text" 
                        required
                        value={formCommessa}
                        onChange={(e) => setFormCommessa(e.target.value)}
                        placeholder="Es: C-2612"
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cliente *
                      </label>
                      <input 
                        type="text" 
                        required
                        value={formCliente}
                        onChange={(e) => setFormCliente(e.target.value)}
                        placeholder="Es: Maserati"
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Disegno & Origine NC */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Codice Disegno *
                      </label>
                      <input 
                        type="text" 
                        required
                        value={formCodiceDisegno}
                        onChange={(e) => setFormCodiceDisegno(e.target.value)}
                        placeholder="Es: DIS-441-A"
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Origine NC
                      </label>
                      <select
                        value={formTipoNc}
                        onChange={(e) => setFormTipoNc(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                      >
                        <option value="Interna">Interna</option>
                        <option value="Cliente">Cliente (Reclamo)</option>
                        <option value="Fornitore">Fornitore</option>
                      </select>
                    </div>
                  </div>

                  {/* Date: Apertura & Chiusura */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Data Apertura *
                      </label>
                      <input 
                        type="date" 
                        required
                        value={formDataApertura}
                        onChange={(e) => setFormDataApertura(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Data Chiusura
                      </label>
                      <input 
                        type="date" 
                        value={formDataChiusura}
                        onChange={(e) => setFormDataChiusura(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Reparti Associati (Multiselezione / Inserimento multiplo) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Reparti competenza * <span className="text-[10px] text-slate-400 font-normal italic">(Almeno uno)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddRepartoField}
                        className="text-xs px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 hover:border-blue-200 text-blue-700 font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Aggiungi Reparto
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {formReparti.map((field, idx) => (
                        <div key={field.id} className="flex flex-col gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-150 pb-1 mb-0.5">
                            <span className="text-[10px] font-bold text-slate-400">
                              {idx + 1}° Reparto
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateRepartoField(field.id, { isCustom: !field.isCustom, value: field.isCustom ? REPARTI_PREDEFINITI[0] : "" })}
                              className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                              {field.isCustom ? "Cambia in predefinito" : "Scrivi a mano"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Nome Reparto */}
                            <div>
                              {field.isCustom ? (
                                <input 
                                  type="text" 
                                  required
                                  value={field.value}
                                  onChange={(e) => handleUpdateRepartoField(field.id, { value: e.target.value })}
                                  placeholder="Scrivi nome reparto..."
                                  className="w-full border border-blue-200 bg-white rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium text-slate-800"
                                />
                              ) : (
                                <select
                                  value={field.value}
                                  onChange={(e) => handleUpdateRepartoField(field.id, { value: e.target.value })}
                                  className="w-full border border-slate-200 bg-white rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold text-slate-800 cursor-pointer"
                                >
                                  {REPARTI_PREDEFINITI.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Costo Reparto */}
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">€</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  required
                                  value={field.costo !== undefined ? field.costo : 0}
                                  onChange={(e) => handleUpdateRepartoField(field.id, { costo: Number(e.target.value) || 0 })}
                                  placeholder="Costo reparto..."
                                  className="w-full border border-slate-200 bg-white rounded-lg text-xs pl-6 pr-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold font-mono text-slate-800"
                                />
                              </div>

                              {formReparti.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRepartoField(field.id)}
                                  className="p-1.5 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-md transition-colors cursor-pointer"
                                  title="Rimuovi questo reparto"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Causa (Scelta Pred o Libera) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Causa anomalia *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormCausaCustomOpen(!formCausaCustomOpen);
                          setFormCausaCustomValue("");
                        }}
                        className="text-[10px] text-blue-600 font-medium hover:underline"
                      >
                        {formCausaCustomOpen ? "Seleziona standard" : "Inserisci a mano"}
                      </button>
                    </div>
                    {formCausaCustomOpen ? (
                      <input 
                        type="text" 
                        required
                        value={formCausaCustomValue}
                        onChange={(e) => setFormCausaCustomValue(e.target.value)}
                        placeholder="Inserisci causa personalizzata..."
                        className="w-full border border-slate-200 border-blue-400 bg-blue-50/20 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    ) : (
                      <select
                        value={formCausa}
                        onChange={(e) => setFormCausa(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                      >
                        {CAUSE_PREDEFINITE.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Note / Spiegazione dell'accaduto */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Note / Spiegazione dell'accaduto
                    </label>
                    <textarea 
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      placeholder="Descrivi cosa è successo, i dettagli dell'anomalia o azioni immediate..."
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none font-medium text-slate-800"
                    />
                  </div>

                  {/* Costo, Persona & Responsabile */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Costo Totale Non Conformità (€)
                    </label>
                    <input 
                      type="number" 
                      readOnly
                      disabled
                      value={calculatedTotalFormCosto.toFixed(2)}
                      placeholder="0.00"
                      className="w-full border border-slate-200 bg-slate-100 rounded-lg text-xs px-2.5 py-1.5 font-mono text-slate-500 focus:outline-hidden select-none cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Calcolato automaticamente sommando i costi dei singoli reparti aggiunti sopra
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Operatore / Persona
                      </label>
                      <input 
                        type="text" 
                        value={formPersona}
                        onChange={(e) => setFormPersona(e.target.value)}
                        placeholder="Nome operatore"
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Responsabile *
                      </label>
                      <input 
                        type="text" 
                        value={formResponsabile}
                        onChange={(e) => setFormResponsabile(e.target.value)}
                        placeholder="Nome responsabile"
                        className="w-full border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Pulsante Submit */}
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm mt-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Registrarne sul Database
                  </button>

                </form>
              </div>

            </motion.div>
          )}

          {/* TAB 2: TABELLE & MATRICI */}
          {activeTab === "tables" && (
            <motion.div
              key="tables"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              
              {/* TABELLA MENSILE NC INTERNE E NC CLIENTE */}
              <div className="bg-white p-6 border border-slate-200 overflow-hidden">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    Statistiche di Dettaglio Mensile (Interna vs Cliente)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tabulazione dei quantitativi e dei costi calcolata per ogni mese dell'anno d'esercizio {selectedYear}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-150 bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-3.5">MESE</th>
                        <th className="p-3.5 text-center bg-blue-50/40 text-blue-900" colSpan={2}>
                          NC INTERNE
                        </th>
                        <th className="p-3.5 text-center bg-amber-50/40 text-amber-900" colSpan={2}>
                          NC CLIENTE (RECLAMI)
                        </th>
                        <th className="p-3.5 text-center bg-slate-100 text-slate-900" colSpan={2}>
                          SOMMA TOTALE (INT + CLI)
                        </th>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50/30 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="p-2 pl-3.5">Nominativo</th>
                        <th className="p-2 text-center bg-blue-50/20">N&deg; NC</th>
                        <th className="p-2 text-right bg-blue-50/20">Costo (€)</th>
                        <th className="p-2 text-center bg-amber-50/20">N&deg; NC</th>
                        <th className="p-2 text-right bg-amber-50/20 font-sans">Costo (€)</th>
                        <th className="p-2 text-center bg-slate-100/50">N&deg; Totale</th>
                        <th className="p-2 text-right bg-slate-100/50">Costo Totale (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {monthlyReportData.rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-800">
                          <td className="p-3 font-bold text-slate-900">{row.nome}</td>
                          
                          {/* Interna */}
                          <td className={`p-3 text-center bg-blue-50/10 ${row.internaCount > 0 ? "text-blue-600 font-bold" : "text-slate-400"}`}>
                            {row.internaCount}
                          </td>
                          <td className="p-3 text-right bg-blue-50/10 font-mono text-slate-700">
                            €{row.internaCost.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          
                          {/* Cliente */}
                          <td className={`p-3 text-center bg-amber-50/10 ${row.clienteCount > 0 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                            {row.clienteCount}
                          </td>
                          <td className="p-3 text-right bg-amber-50/10 font-mono text-slate-700">
                            €{row.clienteCost.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Combinati */}
                          <td className="p-3 text-center bg-slate-100/20 font-bold text-slate-700">
                            {row.combinedCount}
                          </td>
                          <td className="p-3 text-right bg-slate-100/20 font-mono font-bold text-slate-900">
                            €{row.combinedCost.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}

                      {/* Riga Totali */}
                      <tr className="bg-slate-900 text-white font-bold text-sm">
                        <td className="p-4 rounded-bl-xl text-xs tracking-wider uppercase">TOTALE ANNO</td>
                        
                        {/* Totale Interna */}
                        <td className="p-4 text-center text-xs bg-slate-800/50">
                          {monthlyReportData.totals.internaCount} NC
                        </td>
                        <td className="p-4 text-right font-mono text-xs bg-slate-800/50">
                          €{monthlyReportData.totals.internaCost.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Totale Cliente */}
                        <td className="p-4 text-center text-xs bg-slate-800/30">
                          {monthlyReportData.totals.clienteCount} NC
                        </td>
                        <td className="p-4 text-right font-mono text-xs bg-slate-800/30">
                          €{monthlyReportData.totals.clienteCost.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Grand Totals */}
                        <td className="p-4 text-center text-xs bg-slate-800">
                          {monthlyReportData.totals.combinedCount} NC
                        </td>
                        <td className="p-4 text-right font-mono rounded-br-xl text-yellow-400">
                          €{monthlyReportData.totals.combinedCost.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MATRICE REPARTI x MESI */}
              <div className="bg-white p-6 border border-slate-200 overflow-hidden">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    Matrice di Distribuzione (Reparti &times; Mesi)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Incidenza di anomalie e costi associati distribuiti per reparto produttivo e per mese per l'anno {selectedYear}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 border-slate-200 text-slate-800 font-bold uppercase tracking-wide text-[10px]">
                        <th className="p-4 border-r border-slate-200">MESE</th>
                        {departmentsMatrix.columns.map(dept => (
                          <th key={dept} className="p-4 text-center border-r border-slate-200 bg-slate-50/50">
                            {dept}
                          </th>
                        ))}
                        <th className="p-4 text-center bg-slate-900 text-white font-bold">
                          TOTALE MESE
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {departmentsMatrix.rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors font-medium">
                          <td className="p-3 border-r border-slate-200 font-bold text-slate-900 bg-slate-50/20">
                            {row.nome}
                          </td>
                          {departmentsMatrix.columns.map(dept => {
                            const val = row.cells[dept];
                            return (
                              <td key={dept} className="p-3 border-r border-slate-200 text-center hover:bg-slate-100/50 transition-all">
                                {val.count > 0 ? (
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded-sm inline-block">
                                      {val.count} NC
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      &euro;{val.cost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-light font-mono">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center bg-slate-50/40 font-bold text-slate-900">
                            <div className="space-y-0.5">
                              <div>{row.totalCount} NC</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                &euro;{row.totalCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Riga Totale Reparto (Fondo matrice) */}
                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="p-4 border-r border-slate-800 rounded-bl-xl text-xs uppercase tracking-wider">
                          TOTALE REPARTO
                        </td>
                        {departmentsMatrix.columns.map(dept => {
                          const tot = departmentsMatrix.repartiTotals[dept];
                          return (
                            <td key={dept} className="p-4 border-r border-slate-800 text-center bg-slate-800/30 text-xs">
                              <div className="space-y-0.5">
                                <div className="text-blue-300">{tot.count} NC</div>
                                <div className="font-mono text-[10px] text-yellow-400">
                                  &euro;{tot.cost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-4 text-center rounded-br-xl bg-slate-950 text-xs">
                          <div className="space-y-0.5 text-white">
                            <div>{departmentsMatrix.grandTotals.count} NC</div>
                            <div className="font-mono text-yellow-300">
                              &euro;{departmentsMatrix.grandTotals.cost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: REGISTRO COMPLETATO */}
          {activeTab === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              <div className="bg-white p-6 border border-slate-200">
                
                {/* RICERCA & AZIONI MASSIVE */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cerca per commessa, cliente, reparto, responsabile, causa..."
                      className="w-full border border-slate-200 bg-slate-50/50 rounded-xl text-xs pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="text-slate-400 hover:text-slate-600 absolute top-3 right-3"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {searchedNCs.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wide text-[10px]">
                          <th className="p-3">DATA</th>
                          <th className="p-3">TIPO</th>
                          <th className="p-3">COMMESSA</th>
                          <th className="p-3">CLIENTE</th>
                          <th className="p-3">DISEGNO</th>
                          <th className="p-3">REPARTO</th>
                          <th className="p-3">CAUSA / ANOMALIA</th>
                          <th className="p-3">NOTE / SPIEGAZIONE</th>
                          <th className="p-3 text-right">COSTO</th>
                          <th className="p-3">RESPONSABILE</th>
                          <th className="p-3 text-center">AZIONI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {searchedNCs.map(nc => (
                          <tr key={nc.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-700">
                            
                            {/* Data */}
                            <td className="p-3 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">{nc.data_apertura}</div>
                              {nc.data_chiusura ? (
                                <div className="text-[10px] text-emerald-600">Chiusura: {nc.data_chiusura}</div>
                              ) : (
                                <div className="text-[10px] text-amber-500 font-bold">APERTA</div>
                              )}
                            </td>

                            {/* Tipo NC */}
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                nc.tipo_nc === "Interna"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : nc.tipo_nc === "Cliente"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-purple-50 text-purple-700 border border-purple-100"
                              }`}>
                                {nc.tipo_nc}
                              </span>
                            </td>

                            {/* Commessa */}
                            <td className="p-3 font-bold text-slate-900 font-mono">
                              {nc.commessa}
                            </td>

                            {/* Cliente */}
                            <td className="p-3 text-slate-900">
                              {nc.cliente}
                            </td>

                            {/* Disegno */}
                            <td className="p-3 font-mono text-slate-500 text-[11px]">
                              {nc.codice_disegno}
                            </td>

                            {/* Reparto */}
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                                {nc.reparto}
                              </span>
                            </td>

                            {/* Causa */}
                            <td className="p-3 max-w-[180px] truncate text-slate-600 text-xs" title={nc.causa}>
                              {nc.causa}
                            </td>

                            {/* Note */}
                            <td className="p-3 max-w-[220px] truncate text-slate-500 text-xs italic" title={nc.note || "Nessuna nota"}>
                              {nc.note || <span className="text-slate-300">Nessuna spiegazione</span>}
                            </td>

                            {/* Costo */}
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              €{nc.costo.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Responsabile */}
                            <td className="p-3 text-slate-500 whitespace-nowrap">
                              <div className="font-semibold text-slate-700">{nc.responsabile}</div>
                              <div className="text-[10px] text-slate-400">Op: {nc.persona}</div>
                            </td>

                            {/* Azioni */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setEditingNc(nc)}
                                  title="Modifica Non Conformità"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNC(nc.id)}
                                  title="Elimina Non Conformità"
                                  className="p-1.5 text-slate-400 hover:text-red-655 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-bold text-sm">Nessuna Non Conformità trovata</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Prova a cambiare i filtri di ricerca superiori o ripristina la demo.</p>
                  </div>
                )}

              </div>

            </motion.div>
          )}

          {/* TAB 5: ANALISI TREND MENSILI */}
          {activeTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* KPIs Summary for Month-over-Month Trends */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 1. Mese di Picco NC (Count) */}
                <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">MESE CON PIÙ NC</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Picco assoluto di frequenza</p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-2xl font-semibold tracking-tight text-slate-900">
                      {(() => {
                        const maxVal = Math.max(...trendsReportData.map(d => d.totalCount));
                        const maxMonth = trendsReportData.find(d => d.totalCount === maxVal);
                        return maxMonth && maxVal > 0 ? `${maxMonth.monthName} (${maxVal} NC)` : "Nessuno";
                      })()}
                    </span>
                  </div>
                  <div className="h-0.5 w-full bg-slate-100 mt-3"></div>
                </div>

                {/* 2. Mese di Picco Costi (Cost) */}
                <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-600 tracking-wider uppercase">MESE PIÙ COSTOSO</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Picco massimo economico IMPATTO</p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-2xl font-bold tracking-tight text-slate-950">
                      {(() => {
                        const maxVal = Math.max(...trendsReportData.map(d => d.totalCost));
                        const maxMonth = trendsReportData.find(d => d.totalCost === maxVal);
                        return maxMonth && maxVal > 0 ? `${maxMonth.monthName} (€${maxVal.toLocaleString("it-IT", { maximumFractionDigits: 0 })})` : "Nessuno";
                      })()}
                    </span>
                  </div>
                  <div className="h-0.5 w-full bg-slate-100 mt-3"></div>
                </div>

                {/* 3. Costo Medio Mensile */}
                <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-600 tracking-wider uppercase">COSTO MEDIO MENSILI</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Media calcolata su 12 mesi</p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-2xl font-semibold tracking-tight text-slate-900">
                      €{(trendsReportData.reduce((sum, d) => sum + d.totalCost, 0) / 12).toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-slate-400">/ mese</span>
                  </div>
                  <div className="h-0.5 w-full bg-slate-100 mt-3"></div>
                </div>

                {/* 4. Incremento/Decremento MoM */}
                <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">ULTIMO TREND MoM</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Confronto con mese precedente</p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-4">
                    {(() => {
                      const activeMonths = trendsReportData.filter(d => d.totalCount > 0);
                      if (activeMonths.length >= 2) {
                        const last = activeMonths[activeMonths.length - 1];
                        const prev = activeMonths[activeMonths.length - 2];
                        const diffCost = last.totalCost - prev.totalCost;
                        const pct = prev.totalCost > 0 ? Math.round((diffCost / prev.totalCost) * 100) : 0;
                        const isUp = diffCost > 0;
                        return (
                          <div className="flex items-center gap-1">
                            <span className={`text-lg font-bold ${isUp ? "text-amber-600" : "text-emerald-600"}`}>
                              {isUp ? "↑ +" : "↓ "} {pct}%
                            </span>
                            <span className="text-[9px] text-slate-400 leading-normal">Costo ({last.monthName} vs {prev.monthName})</span>
                          </div>
                        );
                      }
                      return <span className="text-xs font-semibold text-slate-500">Dati insufficienti</span>;
                    })()}
                  </div>
                  <div className="h-0.5 w-full bg-slate-100 mt-3"></div>
                </div>
              </div>

              {/* BARRA FILTRI SERIE TEMPORALI (ABILITAZIONE / DISABILITAZIONE CON SPUNTA) */}
              <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-600">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filtra Serie Temporali</h4>
                    <p className="text-[10px] text-slate-400">Spunta le opzioni per abilitare o disabilitare le linee nei due grafici sottostanti</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={showTrendInterna}
                      onChange={(e) => setShowTrendInterna(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      NC Interne
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-amber-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={showTrendCliente}
                      onChange={(e) => setShowTrendCliente(e.target.checked)}
                      className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      NC Cliente
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-purple-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={showTrendFornitore}
                      onChange={(e) => setShowTrendFornitore(e.target.checked)}
                      className="w-4 h-4 text-purple-500 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      NC Fornitore
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={showTrendTotale}
                      onChange={(e) => setShowTrendTotale(e.target.checked)}
                      className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                      Totale Generico
                    </span>
                  </label>
                </div>
              </div>

              {/* DUAL LINE CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Grafico Numero NC */}
                <div className="bg-white p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Quantità Non Conformità (Frequenze MoM)</h3>
                      <p className="text-xs text-slate-400">Andamento mensile suddiviso per tipologia</p>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendsReportData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="monthName" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip content={<CustomTrendTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        
                        {showTrendInterna && <Line type="monotone" dataKey="internaCount" name="NC Interne" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                        {showTrendCliente && <Line type="monotone" dataKey="clienteCount" name="NC Cliente" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                        {showTrendFornitore && <Line type="monotone" dataKey="fornitoreCount" name="NC Fornitore" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                        {showTrendTotale && <Line type="monotone" dataKey="totalCount" name="Totale Generico" stroke="#0f172a" strokeWidth={3} strokeDasharray="5 5" activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Grafico Costi NC */}
                <div className="bg-white p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Impatto Economico Mensile (Costi MoM)</h3>
                      <p className="text-xs text-slate-400">Andamento mensile del danno monetario espresso in €</p>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendsReportData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="monthName" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit="€" />
                        <Tooltip content={<CustomTrendTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        
                        {showTrendInterna && <Line type="monotone" dataKey="internaCost" name="Costo Interne (€)" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                        {showTrendCliente && <Line type="monotone" dataKey="clienteCost" name="Costo Cliente (€)" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                        {showTrendFornitore && <Line type="monotone" dataKey="fornitoreCost" name="Costo Fornitore (€)" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                        {showTrendTotale && <Line type="monotone" dataKey="totalCost" name="Costo Totale (€)" stroke="#0f172a" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* MONTHLY SUMMARY STATEMENT TABLE IN GEOMETRIC STYLE */}
              <div className="bg-white border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Sintesi Statistica Mensile Dettagliata</h4>
                    <p className="text-xs text-slate-450 text-slate-400">Confronto tabellare MoM dei valori assoluti e costi complessivi per l'anno {selectedYear}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">Mese</th>
                        <th className="p-3 text-center">NC Interne (N° / €)</th>
                        <th className="p-3 text-center">NC Cliente (N° / €)</th>
                        <th className="p-3 text-center">NC Fornitore (N° / €)</th>
                        <th className="p-3 text-right bg-slate-100 font-bold text-slate-900">Totale Quantità</th>
                        <th className="p-3 text-right bg-slate-100 font-bold text-slate-900">Totale Costi (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trendsReportData.map((d) => (
                        <tr key={d.monthId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">{d.monthName}</td>
                          <td className="p-3 text-center text-slate-600">
                            {d.internaCount} <span className="text-slate-400 font-light mx-1">/</span> €{d.internaCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-3 text-center text-slate-600">
                            {d.clienteCount} <span className="text-slate-400 font-light mx-1">/</span> €{d.clienteCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-3 text-center text-slate-600">
                            {d.fornitoreCount} <span className="text-slate-400 font-light mx-1">/</span> €{d.fornitoreCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-900 bg-slate-50/40">
                            {d.totalCount} NC
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 bg-slate-50/60">
                            €{d.totalCost.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: ANALISI RIPETITIVITÀ ERRORI & PERSONALE */}
          {activeTab === "repetition" && (
            <motion.div
              key="repetition"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Selettore di Modalità (Mensile vs Annuale) */}
              <div className="bg-white border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Analisi Ricorrenze Anomalie & Responsabilità Personale
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitoraggio degli errori ripetitivi e individuazione delle aree di rischio per la formazione del personale - Anno {selectedYear}
                  </p>
                </div>
                
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRepetitionMode("mensile")}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                      repetitionMode === "mensile"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Filtro Mensile
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepetitionMode("annuale")}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                      repetitionMode === "annuale"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Filtro Annuale
                  </button>
                </div>
              </div>

              {/* Se MESE Selezionato, mostra barra dei mesi */}
              {repetitionMode === "mensile" && (
                <div className="bg-slate-100/55 border border-slate-200/80 p-2.5 rounded-lg">
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                    {MESI_LIST.map(m => {
                      const countInMonth = yearNCs.filter(nc => nc.data_apertura.substring(5, 7) === m.id).length;
                      const isSelected = repetitionMonth === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setRepetitionMonth(m.id)}
                          className={`p-2 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs border border-indigo-700"
                              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                          }`}
                        >
                          <span className="text-[10px] font-extrabold tracking-wider">{m.nome}</span>
                          <span className={`text-[9px] mt-1 px-1 rounded-sm leading-none font-bold ${
                            isSelected 
                              ? "bg-indigo-700 text-indigo-100" 
                              : countInMonth > 0 
                                ? "bg-slate-100 text-slate-600" 
                                : "bg-slate-50 text-slate-300"
                          }`}>
                            {countInMonth} NC
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {repetitionMode === "mensile" ? (
                /* =======================================================
                   SEZIONE MENSILE (MESE PER MESE)
                   ======================================================= */
                <div className="space-y-6">
                  {monthNCs.length === 0 ? (
                    <div className="bg-white border border-slate-200 py-12 px-6 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Nessuna Non Conformità registrata nel mese selezionato</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        In questo mese non sono state rilevate anomalie nell'anno {selectedYear}. Ottimo risultato di affidabilità operativa!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* 1. ANALISI ERRORI (CAUSE) MENSILE */}
                      <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">Analisi Cause di Anomalia ({MESI_LIST.find(m => m.id === repetitionMonth)?.nome} {selectedYear})</h4>
                              <p className="text-[11px] text-slate-400">Errori ripetuti evidenziati per azioni correttive immediate</p>
                            </div>
                            <span className="text-xs font-bold font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                              {monthlyErrorAnalysis.length} Cause Rilevate
                            </span>
                          </div>

                          <div className="space-y-4">
                            {monthlyErrorAnalysis.map((item) => {
                              const totalMonthNCsCount = monthNCs.length;
                              const percentage = totalMonthNCsCount > 0 ? Math.round((item.count / totalMonthNCsCount) * 100) : 0;
                              
                              return (
                                <div key={item.causa} className="p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-all bg-slate-50/20">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="space-y-0.5">
                                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        {item.causa}
                                      </span>
                                      {item.isRepetitive && (
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded mt-1 border border-amber-200/60 uppercase">
                                          <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                          Errore Ripetitivo
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-bold text-slate-900">{item.count} NC ({percentage}%)</span>
                                      <p className="text-[10px] text-red-600 font-bold font-mono">Costi: €{item.totalCost.toLocaleString("it-IT")}</p>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${item.isRepetitive ? "bg-amber-500" : "bg-blue-500"}`} 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 2. ANALISI OPERATORI COINVOLTI MENSILE */}
                      <div className="bg-white border border-slate-200 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">Affidabilità Operatori / Personale ({MESI_LIST.find(m => m.id === repetitionMonth)?.nome} {selectedYear})</h4>
                              <p className="text-[11px] text-slate-400">Responsabili degli incidenti e anomalie registrate nel mese</p>
                            </div>
                            <span className="text-xs font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              {monthlyPersonnelAnalysis.length} Personale Attivo
                            </span>
                          </div>

                          <div className="space-y-4">
                            {monthlyPersonnelAnalysis.map((item) => {
                              return (
                                <div key={item.persona} className="p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-all bg-slate-50/20">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-slate-700 border border-slate-200 uppercase">
                                          {item.persona.substring(0, 2)}
                                        </span>
                                        <span className="text-xs font-bold text-slate-800">{item.persona}</span>
                                        {item.isRepetitive && (
                                          <span className="bg-red-50 text-red-700 text-[8px] font-extrabold px-1.5 py-0.2 rounded border border-red-200/50 uppercase">
                                            Frequenza Critica (&gt;1)
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-[10px] text-slate-500 pl-7 mt-1.5 space-y-1">
                                        <p className="font-medium text-slate-600">
                                          Errore più frequente: <span className="font-semibold text-indigo-600">{item.topCausa}</span> ({item.topCausaCount} volte)
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(item.causes).map(([cause, cnt]) => (
                                            <span key={cause} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-medium scale-95 origin-left">
                                              {cause}: {cnt}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0 pl-2">
                                      <span className="text-xs font-bold text-slate-900 block">{item.count} Anomalie</span>
                                      <span className="text-[10px] text-red-700 bg-red-50 font-bold px-1.5 py-0.5 rounded block mt-1 font-mono">
                                        €{item.totalCost.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* =======================================================
                   SEZIONE ANNUALE (ANALISI COMPLESSIVA)
                   ======================================================= */
                <div className="space-y-8">
                  {yearNCs.length === 0 ? (
                    <div className="bg-white border border-slate-200 py-12 px-6 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Nessuna Non Conformità registrata per l'anno {selectedYear}</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        I dati storici di questo anno non contengono non conformità registrate.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* STATISTICHE GENERALI ANNUALI DI RICORRENZA */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Tasso Concentrazione Errori</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">Analisi di Pareto: la causa principale sul totale delle NC</p>
                          </div>
                          <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-2xl font-semibold tracking-tight text-slate-900">
                              {(() => {
                                if (annualErrorAnalysis.length === 0) return "0%";
                                const top = annualErrorAnalysis[0];
                                const pct = Math.round((top.count / yearNCs.length) * 100);
                                return `${pct}% (${top.causa.substring(0, 20)}...)`;
                              })()}
                            </span>
                          </div>
                          <div className="h-0.5 w-full bg-slate-100 mt-3"></div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-red-600 tracking-wider uppercase">Costo Massimo Disfunzione</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">La singola causa di anomalia più onerosa dell'anno</p>
                          </div>
                          <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-2xl font-semibold tracking-tight text-slate-900">
                              {(() => {
                                if (annualErrorAnalysis.length === 0) return "Nessuno";
                                const sortedByCost = [...annualErrorAnalysis].sort((a, b) => b.totalCost - a.totalCost);
                                const topCost = sortedByCost[0];
                                return `€${topCost.totalCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })} (${topCost.causa.substring(0, 16)}...)`;
                              })()}
                            </span>
                          </div>
                          <div className="h-0.5 w-full bg-slate-100 mt-3"></div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-950 tracking-wider uppercase">Affidabilità del Personale</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">Operatori coinvolti nel registro non conformità</p>
                          </div>
                          <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-2xl font-semibold tracking-tight text-slate-900">
                              {annualPersonnelAnalysis.length} Persone Coinvolte
                            </span>
                          </div>
                          <div className="h-0.5 w-full bg-slate-100 mt-3"></div>
                        </div>
                      </div>

                      {/* 1. CLASSIFICA ANOMALIE ANNUALI */}
                      <div className="bg-white border border-slate-200 p-6">
                        <div className="pb-3 border-b border-slate-100 mb-6">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Graduatoria Annuale delle Anomalie e Cause</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Riepilogo totale delle cause d'errore registrate con indicazione di persistenza e stagionalità (mesi di accadimento)</p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 border-b-slate-200">
                                <th className="p-3">Causa / Anomalia</th>
                                <th className="p-3 text-center">Frequenza Totale</th>
                                <th className="p-3">Persistenza Temporale (Mesi)</th>
                                <th className="p-3 text-right">Costo Complessivo (€)</th>
                                <th className="p-3 text-right">Costo Medio / Errore</th>
                                <th className="p-3">Grado Criticità</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {annualErrorAnalysis.map((item, index) => {
                                const isCritical = item.count > 3 || item.totalCost > 2000;
                                const avgCost = item.count > 0 ? item.totalCost / item.count : 0;
                                return (
                                  <tr key={item.causa} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                                      <span className="w-5 h-5 bg-slate-100 rounded text-slate-500 font-bold flex items-center justify-center text-[10px]">
                                        #{index + 1}
                                      </span>
                                      {item.causa}
                                    </td>
                                    <td className="p-3 text-center text-slate-900 font-bold">
                                      {item.count} volte
                                    </td>
                                    <td className="p-3">
                                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                        {item.monthsFormatted}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-red-650 text-red-600">
                                      €{item.totalCost.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-right text-slate-600 font-mono">
                                      €{avgCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="p-3">
                                      {isCritical ? (
                                        <span className="inline-block bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-200">
                                          CRITICA (Richiede Audit)
                                        </span>
                                      ) : item.count > 1 ? (
                                        <span className="inline-block bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200">
                                          MODERATA (Controllare)
                                        </span>
                                      ) : (
                                        <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                                          BASSISSIMA
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 2. TABELLA CLASSIFICA AFFIDABILITA PERSONALE */}
                      <div className="bg-white border border-slate-200 p-6">
                        <div className="pb-3 border-b border-slate-100 mb-6">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Performance del Personale & Ripetitività Errori individuali</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Analisi quantitativa dei collaboratori coinvolti per tracciare le cause di errore più frequenti e abilitare riqualificazioni formative mirate</p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 border-b-slate-200">
                                <th className="p-3">Operatore / Dipendente</th>
                                <th className="p-3 text-center">N° Errori Commessi</th>
                                <th className="p-3">Errore Ricorrente Individuale (Top Errore)</th>
                                <th className="p-3 text-right">Danno Economico Complessivo</th>
                                <th className="p-3 text-right">Media Costo / Incidente</th>
                                <th className="p-3 text-center">Tasso Frequenza</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {annualPersonnelAnalysis.map((p) => {
                                const avgCost = p.count > 0 ? p.totalCost / p.count : 0;
                                const isHighFreq = p.count >= 3;
                                return (
                                  <tr key={p.persona} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                                      <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 uppercase">
                                        {p.persona.substring(0, 2)}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900">{p.persona}</p>
                                        <p className="text-[10px] text-slate-400 font-normal">Operatore qualificato</p>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center text-slate-800 font-bold text-sm bg-slate-50/30">
                                      {p.count}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-slate-700">{p.topCausa}</span>
                                        <span className="text-[10px] text-indigo-650 text-indigo-600 font-medium">
                                          Comportamento registrato {p.topCausaCount} volte su {p.count} errori ({Math.round((p.topCausaCount / p.count) * 100)}% del totale personale)
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-red-650 text-red-600">
                                      €{p.totalCost.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-right text-slate-600 font-mono">
                                      €{avgCost.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="p-3 text-center">
                                      {isHighFreq ? (
                                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                                          Critico (Richiede Formazione)
                                        </span>
                                      ) : p.count > 1 ? (
                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                                          Monitoraggio Attivo
                                        </span>
                                      ) : (
                                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                                          Sotto Controllo
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* MODAL DI MODIFICA DELLA NON CONFORMITA */}
      {editingNc && (
        <EditNcModal 
          nc={editingNc}
          reparti={dynamicDepartments}
          cause={CAUSE_PREDEFINITE}
          onSave={handleUpdateNC}
          onClose={() => setEditingNc(null)}
        />
      )}

      {/* MODAL DI CONFERMA ELIMINAZIONE */}
      {ncToDelete && (
        <DeleteConfirmModal 
          id={ncToDelete}
          onConfirm={() => {
            setNcs(prev => prev.filter(item => item.id !== ncToDelete));
            setNcToDelete(null);
          }}
          onClose={() => setNcToDelete(null)}
        />
      )}

    </div>
  );
}

// Interfaccia proprietà del Modal di Modifica
interface EditNcModalProps {
  nc: NonConformita;
  reparti: string[];
  cause: string[];
  onSave: (updated: NonConformita) => void;
  onClose: () => void;
}

// Modal di modifica per l'editing delle Non Conformità
function EditNcModal({ nc, reparti, cause, onSave, onClose }: EditNcModalProps) {
  const [commessa, setCommessa] = useState(nc.commessa);
  const [cliente, setCliente] = useState(nc.cliente);
  const [codiceDisegno, setCodiceDisegno] = useState(nc.codice_disegno);
  const [tipoNc, setTipoNc] = useState(nc.tipo_nc);
  const [dataApertura, setDataApertura] = useState(nc.data_apertura);
  const [dataChiusura, setDataChiusura] = useState(nc.data_chiusura || "");
  const [modalReparti, setModalReparti] = useState<{ id: string; value: string; isCustom: boolean; costo: number }[]>(() => {
    const list = nc.reparto ? nc.reparto.split(",").map(r => r.trim()).filter(Boolean) : [];
    if (list.length === 0) {
      return [{ id: "m-dept-0", value: REPARTI_PREDEFINITI[0], isCustom: false, costo: Number(nc.costo) || 0 }];
    }
    return list.map((val, idx) => {
      let deptCosto = 0;
      if (nc.reparti_costi && nc.reparti_costi[val] !== undefined) {
        deptCosto = nc.reparti_costi[val];
      } else {
        deptCosto = list.length <= 1 ? (Number(nc.costo) || 0) : ((Number(nc.costo) || 0) / list.length);
      }
      return {
        id: `m-dept-${idx}`,
        value: val,
        isCustom: !REPARTI_PREDEFINITI.includes(val),
        costo: Number(deptCosto.toFixed(2))
      };
    });
  });

  const handleAddModuleReparto = () => {
    setModalReparti(prev => [
      ...prev,
      { id: `m-dept-${Date.now()}-${Math.random()}`, value: REPARTI_PREDEFINITI[0], isCustom: false, costo: 0 }
    ]);
  };

  const handleRemoveModuleReparto = (id: string) => {
    if (modalReparti.length > 1) {
      setModalReparti(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleUpdateModuleReparto = (id: string, updates: Partial<{ value: string; isCustom: boolean; costo: number }>) => {
    setModalReparti(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const calculatedTotalModalCosto = useMemo(() => {
    return modalReparti.reduce((sum, item) => sum + (Number(item.costo) || 0), 0);
  }, [modalReparti]);

  const [causa, setCausa] = useState(nc.causa);
  const [costo, setCosto] = useState(nc.costo);
  const [persona, setPersona] = useState(nc.persona);
  const [responsabile, setResponsabile] = useState(nc.responsabile);
  const [note, setNote] = useState(nc.note || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRepartiList = modalReparti
      .map(item => item.value.trim())
      .filter(val => val !== "");
    if (finalRepartiList.length === 0) {
      alert("Devi specificare almeno un reparto.");
      return;
    }

    const repartiCostiMap: Record<string, number> = {};
    modalReparti.forEach(item => {
      const name = item.value.trim();
      if (name) {
        repartiCostiMap[name] = Number(item.costo) || 0;
      }
    });

    onSave({
      ...nc,
      commessa: commessa.trim(),
      cliente: cliente.trim(),
      codice_disegno: codiceDisegno.trim(),
      tipo_nc: tipoNc,
      data_apertura: dataApertura,
      data_chiusura: dataChiusura,
      reparto: finalRepartiList.join(", "),
      reparti_costi: repartiCostiMap,
      causa: causa.trim(),
      costo: calculatedTotalModalCosto,
      persona: persona.trim() || "N/D",
      responsabile: responsabile.trim() || "N/D",
      note: note.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-slate-300 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold font-mono">
              NC
            </div>
            <h3 className="text-sm font-bold tracking-wider uppercase">Modifica Non Conformità ({nc.id})</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Commessa */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Commessa *
              </label>
              <input 
                type="text"
                required
                value={commessa}
                onChange={e => setCommessa(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cliente *
              </label>
              <input 
                type="text"
                required
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Codice Disegno */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Codice Disegno *
              </label>
              <input 
                type="text"
                required
                value={codiceDisegno}
                onChange={e => setCodiceDisegno(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Tipo NC */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tipologia NC *
              </label>
              <select
                value={tipoNc}
                onChange={e => setTipoNc(e.target.value as any)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Interna">Interna</option>
                <option value="Cliente">Cliente</option>
                <option value="Fornitore">Fornitore</option>
              </select>
            </div>

            {/* Data Apertura */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data Apertura *
              </label>
              <input 
                type="date"
                required
                value={dataApertura}
                onChange={e => setDataApertura(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Data Chiusura */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data Chiusura (Opzionale)
              </label>
              <input 
                type="date"
                value={dataChiusura}
                onChange={e => setDataChiusura(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Reparto (Scelta Multipla) */}
            <div className="col-span-1 md:col-span-2 space-y-2 border-t border-slate-150 pt-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Reparti competenza * <span className="text-[10px] text-slate-400 font-normal italic">(Almeno uno)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddModuleReparto}
                  className="text-[10px] px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Aggiungi Reparto
                </button>
              </div>

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {modalReparti.map((field, idx) => (
                  <div key={field.id} className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-1">
                      <span className="text-[10px] font-bold text-slate-400 font-sans">
                        {idx + 1}° Reparto
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateModuleReparto(field.id, { isCustom: !field.isCustom, value: field.isCustom ? REPARTI_PREDEFINITI[0] : "" })}
                        className="text-[9px] text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        {field.isCustom ? "Usa predefinito" : "Scrivi a mano"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Nome */}
                      <div>
                        {field.isCustom ? (
                          <input 
                            type="text" 
                            required
                            value={field.value}
                            onChange={(e) => handleUpdateModuleReparto(field.id, { value: e.target.value })}
                            placeholder="Reparto..."
                            className="w-full border border-blue-200 bg-white rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          />
                        ) : (
                          <select
                            value={field.value}
                            onChange={(e) => handleUpdateModuleReparto(field.id, { value: e.target.value })}
                            className="w-full border border-slate-200 bg-white rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                          >
                            {REPARTI_PREDEFINITI.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Costo specifico */}
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">€</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={field.costo !== undefined ? field.costo : 0}
                            onChange={(e) => handleUpdateModuleReparto(field.id, { costo: Number(e.target.value) || 0 })}
                            placeholder="Costo..."
                            className="w-full border border-slate-200 bg-white rounded pl-5 pr-1 py-1 text-xs font-semibold font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        {modalReparti.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveModuleReparto(field.id)}
                            className="p-1 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded transition-colors cursor-pointer"
                            title="Rimuovi reparto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Causa */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Causa / Anomalia *
              </label>
              <select
                value={causa}
                onChange={e => setCausa(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {cause.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Costo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Costo Complessivo (€) *
              </label>
              <input 
                type="number"
                readOnly
                disabled
                value={calculatedTotalModalCosto.toFixed(2)}
                className="w-full border border-slate-200 bg-slate-100 rounded px-3 py-2 text-xs font-bold font-mono text-slate-500 focus:outline-hidden select-none cursor-not-allowed"
              />
              <p className="text-[9px] text-slate-400 mt-0.5 italic">
                Somma automatica dei costi dei reparti sopra specificati
              </p>
            </div>

            {/* Operatore (Persona) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Operatore / Persona
              </label>
              <input 
                type="text"
                value={persona}
                onChange={e => setPersona(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Note / Spiegazione */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Note / Spiegazione dell'accaduto
              </label>
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Spiega cosa è successo o descrivi il problema in dettaglio..."
                rows={2}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden resize-none text-slate-800"
              />
            </div>

            {/* Responsabile */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Responsabile Assicurazione Qualità / Manager
              </label>
              <input 
                type="text"
                value={responsabile}
                onChange={e => setResponsabile(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-md transition-colors cursor-pointer"
            >
              Salva Modifiche
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Custom icons or wrapper component for Sparkles as Recharts legend can look nice
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.814zM18 7l-.407 2.593L15 10l2.593.407L18 13l.407-2.593L21 10l-2.593-.407L18 7z"
      ></path>
    </svg>
  );
}

// Interfaccia proprietà del Modal di Conferma Eliminazione
interface DeleteConfirmModalProps {
  id: string;
  onConfirm: () => void;
  onClose: () => void;
}

// Modal di conferma rimozione della Non Conformità
function DeleteConfirmModal({ id, onConfirm, onClose }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 animate-pulse">
            <Trash2 className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-sans">Elimina Non Conformità</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Sei sicuro di voler eliminare questa Non Conformità permanentemente? Questa azione rimuoverà il documento dal database e non potrà essere annullata.
          </p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
          >
            Sì, Elimina
          </button>
        </div>
      </motion.div>
    </div>
  );
}
