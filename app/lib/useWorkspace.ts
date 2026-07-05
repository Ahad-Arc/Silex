"use client";

/**
 * useWorkspace — single source of truth for all workspace-level settings.
 *
 * Covers:
 *   - Business information (name, address, GSTIN, email, phone, website)
 *   - Brand kit (logo, stamp, signature, watermark config)
 *   - Invoice defaults (template, currency, tax, payment terms, number format)
 *   - PDF & export preferences
 *
 * All fields are persisted in localStorage and hydrated on mount.
 * Every new invoice automatically inherits these settings.
 */

import { useState, useEffect, useCallback } from "react";

// ─── localStorage helpers ─────────────────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch { return fallback; }
}

function lsw(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    value === null || value === undefined
      ? localStorage.removeItem(key)
      : localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota */ }
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
const K = {
  bizName: "sx_biz_name", bizLegalName: "sx_biz_legal", bizGstin: "sx_biz_gstin",
  bizAddress: "sx_biz_addr", bizCity: "sx_biz_city", bizState: "sx_biz_state",
  bizCountry: "sx_biz_country", bizPostal: "sx_biz_postal",
  bizEmail: "sx_biz_email", bizPhone: "sx_biz_phone", bizWebsite: "sx_biz_website",
  logo: "sx_brand_logo", stamp: "sx_brand_stamp", signature: "sx_brand_sig",
  stampEnabled: "sx_brand_stamp_on", stampOpacity: "sx_brand_stamp_opacity",
  pdfLogo: "sx_pdf_logo", pdfWatermark: "sx_pdf_watermark",
  pdfSig: "sx_pdf_sig", pdfQR: "sx_pdf_qr", pdfPay: "sx_pdf_pay",
  currency: "sx_def_currency", template: "sx_def_template",
  taxRate: "sx_def_taxrate", taxName: "sx_def_taxname", taxInclusive: "sx_def_taxinclusive",
  payTerms: "sx_def_payterms", dueDays: "sx_def_duedays",
  invFormat: "sx_def_invformat", invCounter: "sx_def_invcounter",
  font: "sx_def_font", accent: "sx_def_accent",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WorkspaceState {
  // Business info
  bizName: string; bizLegalName: string; bizGstin: string;
  bizAddress: string; bizCity: string; bizState: string;
  bizCountry: string; bizPostal: string;
  bizEmail: string; bizPhone: string; bizWebsite: string;
  // Brand kit
  logoDataUrl: string | null; stampDataUrl: string | null; signatureDataUrl: string | null;
  stampEnabled: boolean; stampOpacity: number;
  // PDF prefs
  pdfShowLogo: boolean; pdfShowWatermark: boolean; pdfShowSignature: boolean;
  pdfShowQR: boolean; pdfShowPayInstr: boolean;
  // Invoice defaults
  defCurrency: string; defTemplate: string;
  defTaxRate: number; defTaxName: string; defTaxInclusive: boolean;
  defPayTerms: string; defDueDays: number;
  defInvFormat: string; defInvCounter: number;
  defFont: string; defAccent: string;
}

export interface WorkspaceActions {
  setBizName: (v: string) => void; setBizLegalName: (v: string) => void;
  setBizGstin: (v: string) => void; setBizAddress: (v: string) => void;
  setBizCity: (v: string) => void; setBizState: (v: string) => void;
  setBizCountry: (v: string) => void; setBizPostal: (v: string) => void;
  setBizEmail: (v: string) => void; setBizPhone: (v: string) => void;
  setBizWebsite: (v: string) => void;
  setLogo: (v: string | null) => void;
  setStamp: (v: string | null) => void;
  setSignature: (v: string | null) => void;
  setStampEnabled: (v: boolean) => void; setStampOpacity: (v: number) => void;
  setPdfShowLogo: (v: boolean) => void; setPdfShowWatermark: (v: boolean) => void;
  setPdfShowSignature: (v: boolean) => void; setPdfShowQR: (v: boolean) => void;
  setPdfShowPayInstr: (v: boolean) => void;
  setDefCurrency: (v: string) => void; setDefTemplate: (v: string) => void;
  setDefTaxRate: (v: number) => void; setDefTaxName: (v: string) => void;
  setDefTaxInclusive: (v: boolean) => void;
  setDefPayTerms: (v: string) => void; setDefDueDays: (v: number) => void;
  setDefInvFormat: (v: string) => void; setDefInvCounter: (v: number) => void;
  setDefFont: (v: string) => void; setDefAccent: (v: string) => void;
  nextInvoiceNumber: () => string;
}

export type Workspace = WorkspaceState & WorkspaceActions;

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWorkspace(): Workspace {
  const [bizName,        setBizNameS]      = useState("SILEX TECHNOLOGIES INC");
  const [bizLegalName,   setBizLegalNameS] = useState("");
  const [bizGstin,       setBizGstinS]     = useState("");
  const [bizAddress,     setBizAddressS]   = useState("100 Pine Street");
  const [bizCity,        setBizCityS]      = useState("San Francisco");
  const [bizState,       setBizStateS]     = useState("CA");
  const [bizCountry,     setBizCountryS]   = useState("United States");
  const [bizPostal,      setBizPostalS]    = useState("94111");
  const [bizEmail,       setBizEmailS]     = useState("billing@silex.com");
  const [bizPhone,       setBizPhoneS]     = useState("");
  const [bizWebsite,     setBizWebsiteS]   = useState("");
  const [logoDataUrl,    setLogoS]         = useState<string | null>(null);
  const [stampDataUrl,   setStampS]        = useState<string | null>(null);
  const [signatureDataUrl, setSigS]        = useState<string | null>(null);
  const [stampEnabled,   setStampEnS]      = useState(false);
  const [stampOpacity,   setStampOpS]      = useState(0.06);
  const [pdfShowLogo,    setPdfLogoS]      = useState(true);
  const [pdfShowWatermark, setPdfWmS]      = useState(true);
  const [pdfShowSignature, setPdfSigS]     = useState(true);
  const [pdfShowQR,      setPdfQRS]        = useState(false);
  const [pdfShowPayInstr,setPdfPayS]       = useState(true);
  const [defCurrency,    setDefCurrencyS]  = useState("USD");
  const [defTemplate,    setDefTemplateS]  = useState("Modern");
  const [defTaxRate,     setDefTaxRateS]   = useState(0);
  const [defTaxName,     setDefTaxNameS]   = useState("Tax");
  const [defTaxInclusive,setDefTaxInclS]   = useState(false);
  const [defPayTerms,    setDefPayTermsS]  = useState("Net 30");
  const [defDueDays,     setDefDueDaysS]   = useState(30);
  const [defInvFormat,   setDefInvFmtS]    = useState("INV-{YYYY}-{0001}");
  const [defInvCounter,  setDefInvCtrS]    = useState(1);
  const [defFont,        setDefFontS]      = useState("Sans");
  const [defAccent,      setDefAccentS]    = useState("Indigo");

  // Hydrate once from localStorage
  useEffect(() => {
    setBizNameS(ls(K.bizName, "SILEX TECHNOLOGIES INC"));
    setBizLegalNameS(ls(K.bizLegalName, ""));
    setBizGstinS(ls(K.bizGstin, ""));
    setBizAddressS(ls(K.bizAddress, "100 Pine Street"));
    setBizCityS(ls(K.bizCity, "San Francisco"));
    setBizStateS(ls(K.bizState, "CA"));
    setBizCountryS(ls(K.bizCountry, "United States"));
    setBizPostalS(ls(K.bizPostal, "94111"));
    setBizEmailS(ls(K.bizEmail, "billing@silex.com"));
    setBizPhoneS(ls(K.bizPhone, ""));
    setBizWebsiteS(ls(K.bizWebsite, ""));
    setLogoS(ls(K.logo, null));
    setStampS(ls(K.stamp, null));
    setSigS(ls(K.signature, null));
    setStampEnS(ls(K.stampEnabled, false));
    setStampOpS(ls(K.stampOpacity, 0.06));
    setPdfLogoS(ls(K.pdfLogo, true));
    setPdfWmS(ls(K.pdfWatermark, true));
    setPdfSigS(ls(K.pdfSig, true));
    setPdfQRS(ls(K.pdfQR, false));
    setPdfPayS(ls(K.pdfPay, true));
    setDefCurrencyS(ls(K.currency, "USD"));
    setDefTemplateS(ls(K.template, "Modern"));
    setDefTaxRateS(ls(K.taxRate, 0));
    setDefTaxNameS(ls(K.taxName, "Tax"));
    setDefTaxInclS(ls(K.taxInclusive, false));
    setDefPayTermsS(ls(K.payTerms, "Net 30"));
    setDefDueDaysS(ls(K.dueDays, 30));
    setDefInvFmtS(ls(K.invFormat, "INV-{YYYY}-{0001}"));
    setDefInvCtrS(ls(K.invCounter, 1));
    setDefFontS(ls(K.font, "Sans"));
    setDefAccentS(ls(K.accent, "Indigo"));
  }, []);

  // Each setter writes to state + localStorage
  const setBizName      = useCallback((v: string)  => { setBizNameS(v);      lsw(K.bizName, v); }, []);
  const setBizLegalName = useCallback((v: string)  => { setBizLegalNameS(v); lsw(K.bizLegalName, v); }, []);
  const setBizGstin     = useCallback((v: string)  => { setBizGstinS(v);     lsw(K.bizGstin, v); }, []);
  const setBizAddress   = useCallback((v: string)  => { setBizAddressS(v);   lsw(K.bizAddress, v); }, []);
  const setBizCity      = useCallback((v: string)  => { setBizCityS(v);      lsw(K.bizCity, v); }, []);
  const setBizState     = useCallback((v: string)  => { setBizStateS(v);     lsw(K.bizState, v); }, []);
  const setBizCountry   = useCallback((v: string)  => { setBizCountryS(v);   lsw(K.bizCountry, v); }, []);
  const setBizPostal    = useCallback((v: string)  => { setBizPostalS(v);    lsw(K.bizPostal, v); }, []);
  const setBizEmail     = useCallback((v: string)  => { setBizEmailS(v);     lsw(K.bizEmail, v); }, []);
  const setBizPhone     = useCallback((v: string)  => { setBizPhoneS(v);     lsw(K.bizPhone, v); }, []);
  const setBizWebsite   = useCallback((v: string)  => { setBizWebsiteS(v);   lsw(K.bizWebsite, v); }, []);

  const setLogo      = useCallback((v: string | null) => { setLogoS(v);  lsw(K.logo, v); }, []);
  const setStamp     = useCallback((v: string | null) => {
    setStampS(v); lsw(K.stamp, v);
    if (v === null) { setStampEnS(false); lsw(K.stampEnabled, false); }
  }, []);
  const setSignature = useCallback((v: string | null) => { setSigS(v);   lsw(K.signature, v); }, []);
  const setStampEnabled = useCallback((v: boolean) => { setStampEnS(v); lsw(K.stampEnabled, v); }, []);
  const setStampOpacity = useCallback((v: number)  => { setStampOpS(v); lsw(K.stampOpacity, v); }, []);

  const setPdfShowLogo      = useCallback((v: boolean) => { setPdfLogoS(v); lsw(K.pdfLogo, v); }, []);
  const setPdfShowWatermark = useCallback((v: boolean) => { setPdfWmS(v);   lsw(K.pdfWatermark, v); }, []);
  const setPdfShowSignature = useCallback((v: boolean) => { setPdfSigS(v);  lsw(K.pdfSig, v); }, []);
  const setPdfShowQR        = useCallback((v: boolean) => { setPdfQRS(v);   lsw(K.pdfQR, v); }, []);
  const setPdfShowPayInstr  = useCallback((v: boolean) => { setPdfPayS(v);  lsw(K.pdfPay, v); }, []);

  const setDefCurrency    = useCallback((v: string)  => { setDefCurrencyS(v);  lsw(K.currency, v); }, []);
  const setDefTemplate    = useCallback((v: string)  => { setDefTemplateS(v);  lsw(K.template, v); }, []);
  const setDefTaxRate     = useCallback((v: number)  => { setDefTaxRateS(v);   lsw(K.taxRate, v); }, []);
  const setDefTaxName     = useCallback((v: string)  => { setDefTaxNameS(v);   lsw(K.taxName, v); }, []);
  const setDefTaxInclusive= useCallback((v: boolean) => { setDefTaxInclS(v);   lsw(K.taxInclusive, v); }, []);
  const setDefPayTerms    = useCallback((v: string)  => { setDefPayTermsS(v);  lsw(K.payTerms, v); }, []);
  const setDefDueDays     = useCallback((v: number)  => { setDefDueDaysS(v);   lsw(K.dueDays, v); }, []);
  const setDefInvFormat   = useCallback((v: string)  => { setDefInvFmtS(v);    lsw(K.invFormat, v); }, []);
  const setDefInvCounter  = useCallback((v: number)  => { setDefInvCtrS(v);    lsw(K.invCounter, v); }, []);
  const setDefFont        = useCallback((v: string)  => { setDefFontS(v);       lsw(K.font, v); }, []);
  const setDefAccent      = useCallback((v: string)  => { setDefAccentS(v);     lsw(K.accent, v); }, []);

  const nextInvoiceNumber = useCallback((): string => {
    const year   = new Date().getFullYear().toString();
    const month  = String(new Date().getMonth() + 1).padStart(2, "0");
    const padded = String(defInvCounter).padStart(4, "0");
    const num = defInvFormat
      .replace("{YYYY}", year)
      .replace("{YY}",   year.slice(2))
      .replace("{MM}",   month)
      .replace(/\{0+1\}/, padded);
    const next = defInvCounter + 1;
    setDefInvCtrS(next);
    lsw(K.invCounter, next);
    return num;
  }, [defInvCounter, defInvFormat]);

  return {
    bizName, bizLegalName, bizGstin, bizAddress, bizCity, bizState,
    bizCountry, bizPostal, bizEmail, bizPhone, bizWebsite,
    logoDataUrl, stampDataUrl, signatureDataUrl, stampEnabled, stampOpacity,
    pdfShowLogo, pdfShowWatermark, pdfShowSignature, pdfShowQR, pdfShowPayInstr,
    defCurrency, defTemplate, defTaxRate, defTaxName, defTaxInclusive,
    defPayTerms, defDueDays, defInvFormat, defInvCounter, defFont, defAccent,
    setBizName, setBizLegalName, setBizGstin, setBizAddress, setBizCity,
    setBizState, setBizCountry, setBizPostal, setBizEmail, setBizPhone, setBizWebsite,
    setLogo, setStamp, setSignature, setStampEnabled, setStampOpacity,
    setPdfShowLogo, setPdfShowWatermark, setPdfShowSignature, setPdfShowQR, setPdfShowPayInstr,
    setDefCurrency, setDefTemplate, setDefTaxRate, setDefTaxName, setDefTaxInclusive,
    setDefPayTerms, setDefDueDays, setDefInvFormat, setDefInvCounter, setDefFont, setDefAccent,
    nextInvoiceNumber,
  };
}
