"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "./supabase/client";

export interface WorkspaceState {
  workspaceId: string | null;
  loading: boolean;
  // Business info
  bizName: string;
  bizLegalName: string;
  bizGstin: string;
  bizAddress: string;
  bizCity: string;
  bizState: string;
  bizCountry: string;
  bizPostal: string;
  bizEmail: string;
  bizPhone: string;
  bizWebsite: string;
  // Brand kit
  logoDataUrl: string | null;
  stampDataUrl: string | null;
  signatureDataUrl: string | null;
  stampEnabled: boolean;
  stampOpacity: number;
  // PDF prefs
  pdfShowLogo: boolean;
  pdfShowWatermark: boolean;
  pdfShowSignature: boolean;
  pdfShowQR: boolean;
  pdfShowPayInstr: boolean;
  // Invoice defaults
  defCurrency: string;
  defTemplate: string;
  defTaxRate: number;
  defTaxName: string;
  defTaxInclusive: boolean;
  defPayTerms: string;
  defDueDays: number;
  defInvFormat: string;
  defInvCounter: number;
  defFont: string;
  defAccent: string;
}

export interface WorkspaceActions {
  setBizName: (v: string) => void;
  setBizLegalName: (v: string) => void;
  setBizGstin: (v: string) => void;
  setBizAddress: (v: string) => void;
  setBizCity: (v: string) => void;
  setBizState: (v: string) => void;
  setBizCountry: (v: string) => void;
  setBizPostal: (v: string) => void;
  setBizEmail: (v: string) => void;
  setBizPhone: (v: string) => void;
  setBizWebsite: (v: string) => void;
  setLogo: (v: string | null) => void;
  setStamp: (v: string | null) => void;
  setSignature: (v: string | null) => void;
  setStampEnabled: (v: boolean) => void;
  setStampOpacity: (v: number) => void;
  setPdfShowLogo: (v: boolean) => void;
  setPdfShowWatermark: (v: boolean) => void;
  setPdfShowSignature: (v: boolean) => void;
  setPdfShowQR: (v: boolean) => void;
  setPdfShowPayInstr: (v: boolean) => void;
  setDefCurrency: (v: string) => void;
  setDefTemplate: (v: string) => void;
  setDefTaxRate: (v: number) => void;
  setDefTaxName: (v: string) => void;
  setDefTaxInclusive: (v: boolean) => void;
  setDefPayTerms: (v: string) => void;
  setDefDueDays: (v: number) => void;
  setDefInvFormat: (v: string) => void;
  setDefInvCounter: (v: number) => void;
  setDefFont: (v: string) => void;
  setDefAccent: (v: string) => void;
  nextInvoiceNumber: () => string;
}

export type Workspace = WorkspaceState & WorkspaceActions;

export function useWorkspace(): Workspace {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Business info state
  const [bizName, setBizNameS] = useState("SILEX TECHNOLOGIES INC");
  const [bizLegalName, setBizLegalNameS] = useState("");
  const [bizGstin, setBizGstinS] = useState("");
  const [bizAddress, setBizAddressS] = useState("100 Pine Street");
  const [bizCity, setBizCityS] = useState("San Francisco");
  const [bizState, setBizStateS] = useState("CA");
  const [bizCountry, setBizCountryS] = useState("United States");
  const [bizPostal, setBizPostalS] = useState("94111");
  const [bizEmail, setBizEmailS] = useState("billing@silex.com");
  const [bizPhone, setBizPhoneS] = useState("");
  const [bizWebsite, setBizWebsiteS] = useState("");

  // Brand kit state
  const [logoDataUrl, setLogoS] = useState<string | null>(null);
  const [stampDataUrl, setStampS] = useState<string | null>(null);
  const [signatureDataUrl, setSigS] = useState<string | null>(null);
  const [stampEnabled, setStampEnS] = useState(false);
  const [stampOpacity, setStampOpS] = useState(0.06);

  // PDF preferences state
  const [pdfShowLogo, setPdfLogoS] = useState(true);
  const [pdfShowWatermark, setPdfWmS] = useState(true);
  const [pdfShowSignature, setPdfSigS] = useState(true);
  const [pdfShowQR, setPdfQRS] = useState(false);
  const [pdfShowPayInstr, setPdfPayS] = useState(true);

  // Invoice defaults state
  const [defCurrency, setDefCurrencyS] = useState("USD");
  const [defTemplate, setDefTemplateS] = useState("Modern");
  const [defTaxRate, setDefTaxRateS] = useState(0);
  const [defTaxName, setDefTaxNameS] = useState("Tax");
  const [defTaxInclusive, setDefTaxInclS] = useState(false);
  const [defPayTerms, setDefPayTermsS] = useState("Net 30");
  const [defDueDays, setDefDueDaysS] = useState(30);
  const [defInvFormat, setDefInvFmtS] = useState("INV-{YYYY}-{0001}");
  const [defInvCounter, setDefInvCtrS] = useState(1);
  const [defFont, setDefFontS] = useState("Sans");
  const [defAccent, setDefAccentS] = useState("Indigo");

  // Hydrate from Supabase database
  useEffect(() => {
    async function loadWorkspace() {
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: wsUsers, error } = await supabase
        .from("workspace_users")
        .select("workspace_id, workspaces(*)")
        .eq("user_id", user.id)
        .limit(1);

      if (error) {
        console.error("Error fetching workspace:", error.message);
        setLoading(false);
        return;
      }

      if (wsUsers && wsUsers.length > 0) {
        const wsData = wsUsers[0].workspaces;
        const wsId = wsUsers[0].workspace_id;
        setWorkspaceId(wsId);

        setBizNameS(wsData.name || "");
        setBizEmailS(wsData.billing_email || "");
        setBizPhoneS(wsData.phone || "");
        setBizWebsiteS(wsData.website || "");
        setBizGstinS(wsData.tax_id || "");

        // Parse address list
        const addrParts = (wsData.address || "").split(", ");
        if (addrParts.length >= 5) {
          setBizAddressS(addrParts[0]);
          setBizCityS(addrParts[1]);
          setBizStateS(addrParts[2]);
          setBizPostalS(addrParts[3]);
          setBizCountryS(addrParts[4]);
        } else {
          setBizAddressS(wsData.address || "");
        }

        if (wsData.brand_kit) {
          const kit = wsData.brand_kit as any;
          setDefAccentS(kit.accent || "Indigo");
          setDefFontS(kit.font || "Sans");
          setDefTemplateS(kit.template || "Modern");
          setDefTaxRateS(kit.taxRate || 0);
          setDefTaxNameS(kit.taxName || "Tax");
          setDefTaxInclS(kit.taxInclusive || false);
          setDefCurrencyS(kit.currency || "USD");
          setDefPayTermsS(kit.payTerms || "Net 30");
          setDefDueDaysS(kit.dueDays || 30);
          setDefInvFmtS(kit.invFormat || "INV-{YYYY}-{0001}");
          setDefInvCtrS(kit.invCounter || 1);

          setLogoS(kit.logoDataUrl || null);
          setStampS(kit.stampDataUrl || null);
          setSigS(kit.signatureDataUrl || null);
          setStampEnS(kit.stampEnabled || false);
          setStampOpS(kit.stampOpacity || 0.06);

          setPdfLogoS(kit.pdfShowLogo !== false);
          setPdfWmS(kit.pdfShowWatermark !== false);
          setPdfSigS(kit.pdfShowSignature !== false);
          setPdfQRS(kit.pdfShowQR || false);
          setPdfPayS(kit.pdfShowPayInstr !== false);
        }
      }
      setLoading(false);
    }

    loadWorkspace();
  }, []);

  // Realtime subscription for workspace changes
  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient() as any;

    const channel = supabase.channel(`realtime-workspaces-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "workspaces",
          filter: `id=eq.${workspaceId}`,
        },
        (payload: any) => {
          const wsData = payload.new;
          setBizNameS(wsData.name || "");
          setBizEmailS(wsData.billing_email || "");
          setBizPhoneS(wsData.phone || "");
          setBizWebsiteS(wsData.website || "");
          setBizGstinS(wsData.tax_id || "");

          const addrParts = (wsData.address || "").split(", ");
          if (addrParts.length >= 5) {
            setBizAddressS(addrParts[0]);
            setBizCityS(addrParts[1]);
            setBizStateS(addrParts[2]);
            setBizPostalS(addrParts[3]);
            setBizCountryS(addrParts[4]);
          } else {
            setBizAddressS(wsData.address || "");
          }

          if (wsData.brand_kit) {
            const kit = wsData.brand_kit as any;
            setDefAccentS(kit.accent || "Indigo");
            setDefFontS(kit.font || "Sans");
            setDefTemplateS(kit.template || "Modern");
            setDefTaxRateS(kit.taxRate || 0);
            setDefTaxNameS(kit.taxName || "Tax");
            setDefTaxInclS(kit.taxInclusive || false);
            setDefCurrencyS(kit.currency || "USD");
            setDefPayTermsS(kit.payTerms || "Net 30");
            setDefDueDaysS(kit.dueDays || 30);
            setDefInvFmtS(kit.invFormat || "INV-{YYYY}-{0001}");
            setDefInvCtrS(kit.invCounter || 1);

            setLogoS(kit.logoDataUrl || null);
            setStampS(kit.stampDataUrl || null);
            setSigS(kit.signatureDataUrl || null);
            setStampEnS(kit.stampEnabled || false);
            setStampOpS(kit.stampOpacity || 0.06);

            setPdfLogoS(kit.pdfShowLogo !== false);
            setPdfWmS(kit.pdfShowWatermark !== false);
            setPdfSigS(kit.pdfShowSignature !== false);
            setPdfQRS(kit.pdfShowQR || false);
            setPdfPayS(kit.pdfShowPayInstr !== false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  // Update brand kit jsonb helper
  const updateBrandKitField = useCallback(async (field: string, value: any) => {
    if (!workspaceId) return;
    const supabase = createClient() as any;

    const currentKit = {
      accent: field === "accent" ? value : defAccent,
      font: field === "font" ? value : defFont,
      template: field === "template" ? value : defTemplate,
      taxRate: field === "taxRate" ? value : defTaxRate,
      taxName: field === "taxName" ? value : defTaxName,
      taxInclusive: field === "taxInclusive" ? value : defTaxInclusive,
      currency: field === "currency" ? value : defCurrency,
      payTerms: field === "payTerms" ? value : defPayTerms,
      dueDays: field === "dueDays" ? value : defDueDays,
      invFormat: field === "invFormat" ? value : defInvFormat,
      invCounter: field === "invCounter" ? value : defInvCounter,
      logoDataUrl: field === "logoDataUrl" ? value : logoDataUrl,
      stampDataUrl: field === "stampDataUrl" ? value : stampDataUrl,
      signatureDataUrl: field === "signatureDataUrl" ? value : signatureDataUrl,
      stampEnabled: field === "stampEnabled" ? value : stampEnabled,
      stampOpacity: field === "stampOpacity" ? value : stampOpacity,
      pdfShowLogo: field === "pdfShowLogo" ? value : pdfShowLogo,
      pdfShowWatermark: field === "pdfShowWatermark" ? value : pdfShowWatermark,
      pdfShowSignature: field === "pdfShowSignature" ? value : pdfShowSignature,
      pdfShowQR: field === "pdfShowQR" ? value : pdfShowQR,
      pdfShowPayInstr: field === "pdfShowPayInstr" ? value : pdfShowPayInstr,
    };

    await supabase
      .from("workspaces")
      .update({ brand_kit: currentKit })
      .eq("id", workspaceId);
  }, [
    workspaceId, defAccent, defFont, defTemplate, defTaxRate, defTaxName, defTaxInclusive,
    defCurrency, defPayTerms, defDueDays, defInvFormat, defInvCounter, logoDataUrl,
    stampDataUrl, signatureDataUrl, stampEnabled, stampOpacity, pdfShowLogo,
    pdfShowWatermark, pdfShowSignature, pdfShowQR, pdfShowPayInstr
  ]);

  // Persisted setters syncing to DB
  const setBizName = useCallback(async (v: string) => {
    setBizNameS(v);
    if (!workspaceId) return;
    const supabase = createClient() as any;
    await supabase.from("workspaces").update({ name: v }).eq("id", workspaceId);
  }, [workspaceId]);

  const setBizLegalName = useCallback((v: string) => setBizLegalNameS(v), []);

  const setBizGstin = useCallback(async (v: string) => {
    setBizGstinS(v);
    if (!workspaceId) return;
    const supabase = createClient() as any;
    await supabase.from("workspaces").update({ tax_id: v }).eq("id", workspaceId);
  }, [workspaceId]);

  const syncAddress = useCallback(async (
    addr: string, city: string, state: string, postal: string, country: string
  ) => {
    if (!workspaceId) return;
    const fullAddress = [addr, city, state, postal, country].filter(Boolean).join(", ");
    const supabase = createClient() as any;
    await supabase.from("workspaces").update({ address: fullAddress }).eq("id", workspaceId);
  }, [workspaceId]);

  const setBizAddress = useCallback((v: string) => { setBizAddressS(v); syncAddress(v, bizCity, bizState, bizPostal, bizCountry); }, [bizCity, bizState, bizPostal, bizCountry, syncAddress]);
  const setBizCity = useCallback((v: string) => { setBizCityS(v); syncAddress(bizAddress, v, bizState, bizPostal, bizCountry); }, [bizAddress, bizState, bizPostal, bizCountry, syncAddress]);
  const setBizState = useCallback((v: string) => { setBizStateS(v); syncAddress(bizAddress, bizCity, v, bizPostal, bizCountry); }, [bizAddress, bizCity, bizPostal, bizCountry, syncAddress]);
  const setBizPostal = useCallback((v: string) => { setBizPostalS(v); syncAddress(bizAddress, bizCity, bizState, v, bizCountry); }, [bizAddress, bizCity, bizState, syncAddress]);
  const setBizCountry = useCallback((v: string) => { setBizCountryS(v); syncAddress(bizAddress, bizCity, bizState, bizPostal, v); }, [bizAddress, bizCity, bizState, bizPostal, syncAddress]);

  const setBizEmail = useCallback(async (v: string) => {
    setBizEmailS(v);
    if (!workspaceId) return;
    const supabase = createClient() as any;
    await supabase.from("workspaces").update({ billing_email: v }).eq("id", workspaceId);
  }, [workspaceId]);

  const setBizPhone = useCallback(async (v: string) => {
    setBizPhoneS(v);
    if (!workspaceId) return;
    const supabase = createClient() as any;
    await supabase.from("workspaces").update({ phone: v }).eq("id", workspaceId);
  }, [workspaceId]);

  const setBizWebsite = useCallback(async (v: string) => {
    setBizWebsiteS(v);
    if (!workspaceId) return;
    const supabase = createClient() as any;
    await supabase.from("workspaces").update({ website: v }).eq("id", workspaceId);
  }, [workspaceId]);

  const setLogo = useCallback((v: string | null) => { setLogoS(v); updateBrandKitField("logoDataUrl", v); }, [updateBrandKitField]);
  const setStamp = useCallback((v: string | null) => {
    setStampS(v); updateBrandKitField("stampDataUrl", v);
    if (v === null) { setStampEnS(false); updateBrandKitField("stampEnabled", false); }
  }, [updateBrandKitField]);
  const setSignature = useCallback((v: string | null) => { setSigS(v); updateBrandKitField("signatureDataUrl", v); }, [updateBrandKitField]);
  const setStampEnabled = useCallback((v: boolean) => { setStampEnS(v); updateBrandKitField("stampEnabled", v); }, [updateBrandKitField]);
  const setStampOpacity = useCallback((v: number) => { setStampOpS(v); updateBrandKitField("stampOpacity", v); }, [updateBrandKitField]);

  const setPdfShowLogo = useCallback((v: boolean) => { setPdfLogoS(v); updateBrandKitField("pdfShowLogo", v); }, [updateBrandKitField]);
  const setPdfShowWatermark = useCallback((v: boolean) => { setPdfWmS(v); updateBrandKitField("pdfShowWatermark", v); }, [updateBrandKitField]);
  const setPdfShowSignature = useCallback((v: boolean) => { setPdfSigS(v); updateBrandKitField("pdfShowSignature", v); }, [updateBrandKitField]);
  const setPdfShowQR = useCallback((v: boolean) => { setPdfQRS(v); updateBrandKitField("pdfShowQR", v); }, [updateBrandKitField]);
  const setPdfShowPayInstr = useCallback((v: boolean) => { setPdfPayS(v); updateBrandKitField("pdfShowPayInstr", v); }, [updateBrandKitField]);

  const setDefCurrency = useCallback((v: string) => { setDefCurrencyS(v); updateBrandKitField("currency", v); }, [updateBrandKitField]);
  const setDefTemplate = useCallback((v: string) => { setDefTemplateS(v); updateBrandKitField("template", v); }, [updateBrandKitField]);
  const setDefTaxRate = useCallback((v: number) => { setDefTaxRateS(v); updateBrandKitField("taxRate", v); }, [updateBrandKitField]);
  const setDefTaxName = useCallback((v: string) => { setDefTaxNameS(v); updateBrandKitField("taxName", v); }, [updateBrandKitField]);
  const setDefTaxInclusive = useCallback((v: boolean) => { setDefTaxInclS(v); updateBrandKitField("taxInclusive", v); }, [updateBrandKitField]);
  const setDefPayTerms = useCallback((v: string) => { setDefPayTermsS(v); updateBrandKitField("payTerms", v); }, [updateBrandKitField]);
  const setDefDueDays = useCallback((v: number) => { setDefDueDaysS(v); updateBrandKitField("dueDays", v); }, [updateBrandKitField]);
  const setDefInvFormat = useCallback((v: string) => { setDefInvFmtS(v); updateBrandKitField("invFormat", v); }, [updateBrandKitField]);
  const setDefInvCounter = useCallback((v: number) => { setDefInvCtrS(v); updateBrandKitField("invCounter", v); }, [updateBrandKitField]);
  const setDefFont = useCallback((v: string) => { setDefFontS(v); updateBrandKitField("font", v); }, [updateBrandKitField]);
  const setDefAccent = useCallback((v: string) => { setDefAccentS(v); updateBrandKitField("accent", v); }, [updateBrandKitField]);

  const nextInvoiceNumber = useCallback((): string => {
    const year = new Date().getFullYear().toString();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const padded = String(defInvCounter).padStart(4, "0");
    const num = defInvFormat
      .replace("{YYYY}", year)
      .replace("{YY}", year.slice(2))
      .replace("{MM}", month)
      .replace(/\{0+1\}/, padded);
    const next = defInvCounter + 1;
    setDefInvCtrS(next);
    updateBrandKitField("invCounter", next);
    return num;
  }, [defInvCounter, defInvFormat, updateBrandKitField]);

  return {
    workspaceId,
    loading,
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
