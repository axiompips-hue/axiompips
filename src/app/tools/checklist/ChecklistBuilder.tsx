// File: src/app/tools/checklist/ChecklistBuilder.tsx
"use client";

import { useState, useCallback, memo, useEffect, useId } from "react";
import { Container } from "@/components/ui/Container";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

// ============================================================================
// Types
// ============================================================================

interface ChecklistItem {
  id: string;
  text: string;
  category: "technical" | "fundamental" | "risk" | "mindset" | "custom";
  required: boolean;
}

interface ChecklistSession {
  id: string;
  pair: string;
  direction: "buy" | "sell" | "";
  date: string;
  checkedItems: string[];
  notes: string;
  completed: boolean;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const CATEGORY_STYLES: Record<ChecklistItem["category"], { label: string; color: string; bg: string; border: string }> = {
  technical: { label: "Technical", color: "text-blue-400", bg: "bg-blue-950/20", border: "border-blue-800/40" },
  fundamental: { label: "Fundamental", color: "text-purple-400", bg: "bg-purple-950/20", border: "border-purple-800/40" },
  risk: { label: "Risk", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-800/40" },
  mindset: { label: "Mindset", color: "text-green-400", bg: "bg-green-950/20", border: "border-green-800/40" },
  custom: { label: "Custom", color: "text-zinc-400", bg: "bg-zinc-800/30", border: "border-zinc-700/40" },
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "t1", text: "Trend confirmed on higher timeframe", category: "technical", required: true },
  { id: "t2", text: "Price at key support or resistance level", category: "technical", required: true },
  { id: "t3", text: "Clear entry signal (candle pattern, breakout, etc.)", category: "technical", required: true },
  { id: "t4", text: "Stop loss is behind structure (swing high/low)", category: "technical", required: true },
  { id: "r1", text: "Risk is 1-2% or within my rule", category: "risk", required: true },
  { id: "r2", text: "Risk/Reward is at least 1.5:1", category: "risk", required: true },
  { id: "r3", text: "No conflicting positions on correlated pairs", category: "risk", required: false },
  { id: "r4", text: "Total open risk is under 5%", category: "risk", required: false },
  { id: "f1", text: "No high-impact news event in the next 2 hours", category: "fundamental", required: false },
  { id: "f2", text: "Session is appropriate for this pair", category: "fundamental", required: false },
  { id: "m1", text: "I am not trading out of boredom or FOMO", category: "mindset", required: true },
  { id: "m2", text: "I am following my trading plan, not revenge trading", category: "mindset", required: true },
  { id: "m3", text: "I am mentally focused and not stressed", category: "mindset", required: false },
];

const PAIR_OPTIONS = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
  "EURGBP", "EURJPY", "GBPJPY", "XAUUSD", "Other",
];

const MAX_HISTORY = 10;

// ============================================================================
// Item Component
// ============================================================================

const ChecklistItemRow = memo(function ChecklistItemRow({
  item,
  checked,
  onToggle,
  onDelete,
  onEdit,
  isEditMode,
}: {
  item: ChecklistItem;
  checked: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  isEditMode: boolean;
}) {
  const [editText, setEditText] = useState(item.text);
  const [isEditing, setIsEditing] = useState(false);
  const style = CATEGORY_STYLES[item.category];

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 ${
        checked
          ? "bg-zinc-900/30 border-zinc-800/50 opacity-60"
          : `${style.bg} ${style.border}`
      }`}
    >
      {!isEditMode && (
        <button
          onClick={() => onToggle(item.id)}
          className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
            checked
              ? "bg-green-500 border-green-500"
              : "border-zinc-600 hover:border-zinc-400 bg-transparent"
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <input
              className="flex-1 bg-neutral-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:border-accent-500 focus:outline-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              autoFocus
            />
            <button onClick={handleSaveEdit} className="text-xs text-green-400 hover:text-green-300 px-2">Save</button>
            <button onClick={() => { setIsEditing(false); setEditText(item.text); }} className="text-xs text-zinc-400 hover:text-zinc-200 px-2">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm ${checked ? "line-through text-zinc-500" : "text-zinc-200"}`}>
              {item.text}
            </p>
            {item.required && !checked && (
              <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">Required</span>
            )}
          </div>
        )}
        <span className={`text-xs font-medium ${style.color} mt-0.5 block`}>{style.label}</span>
      </div>

      {isEditMode && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// History Card
// ============================================================================

const HistoryCard = memo(function HistoryCard({
  session,
  totalItems,
}: {
  session: ChecklistSession;
  totalItems: number;
}) {
  const score = Math.round((session.checkedItems.length / totalItems) * 100);
  const passed = score >= 80;
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-200 text-sm">{session.pair || "Unknown"}</span>
          {session.direction && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${session.direction === "buy" ? "bg-green-950/50 text-green-400" : "bg-red-950/50 text-red-400"}`}>
              {session.direction.toUpperCase()}
            </span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded ${passed ? "bg-green-950/30 text-green-400" : "bg-red-950/30 text-red-400"}`}>
            {passed ? "Passed" : "Skipped"}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">{new Date(session.timestamp).toLocaleDateString()} &#8226; {session.checkedItems.length}/{totalItems} items</p>
      </div>
      <div className="text-right">
        <span className={`text-lg font-bold font-mono ${passed ? "text-green-400" : "text-red-400"}`}>{score}%</span>
      </div>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function ChecklistBuilder() {
  const [checklist, setChecklist] = useLocalStorage<ChecklistItem[]>("qp_checklist_items", DEFAULT_CHECKLIST);
  const [history, setHistory] = useLocalStorage<ChecklistSession[]>("qp_checklist_history", []);

  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [pair, setPair] = useState("EURUSD");
  const [direction, setDirection] = useState<"buy" | "sell" | "">("");
  const [notes, setNotes] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ChecklistItem["category"]>("custom");
  const [newItemRequired, setNewItemRequired] = useState(false);
  const [activeTab, setActiveTab] = useState<"checklist" | "history">("checklist");
  const [showSuccess, setShowSuccess] = useState(false);

  const totalItems = checklist.length;
  const requiredItems = checklist.filter((i) => i.required);
  const requiredChecked = requiredItems.filter((i) => checkedItems.includes(i.id));
  const allRequiredPassed = requiredChecked.length === requiredItems.length;
  const completionPercent = totalItems > 0 ? Math.round((checkedItems.length / totalItems) * 100) : 0;

  const handleToggle = useCallback((id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setChecklist((prev) => prev.filter((i) => i.id !== id));
    setCheckedItems((prev) => prev.filter((x) => x !== id));
  }, [setChecklist]);

  const handleEditItem = useCallback((id: string, text: string) => {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
  }, [setChecklist]);

  const handleAddItem = useCallback(() => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: generateId(),
      text: newItemText.trim(),
      category: newItemCategory,
      required: newItemRequired,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewItemText("");
    setNewItemRequired(false);
  }, [newItemText, newItemCategory, newItemRequired, setChecklist]);

  const handleReset = useCallback(() => {
    setCheckedItems([]);
    setNotes("");
    setPair("EURUSD");
    setDirection("");
  }, []);

  const handleResetChecklist = useCallback(() => {
    if (window.confirm("Reset checklist to defaults? This will remove all custom items.")) {
      setChecklist(DEFAULT_CHECKLIST);
      setCheckedItems([]);
    }
  }, [setChecklist]);

  const handleSubmit = useCallback(() => {
    const session: ChecklistSession = {
      id: generateId(),
      pair,
      direction,
      date: new Date().toISOString().split("T")[0],
      checkedItems: [...checkedItems],
      notes,
      completed: allRequiredPassed,
      timestamp: Date.now(),
    };
    setHistory((prev) => [session, ...prev].slice(0, MAX_HISTORY));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    handleReset();
  }, [pair, direction, checkedItems, notes, allRequiredPassed, setHistory, handleReset]);

  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <>
      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-950/90 border border-green-800 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-200">Checklist saved to history!</p>
          </div>
        </div>
      )}

      <section className="py-8 md:py-12">
        <Container>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Pre-Trade Checklist</h1>
            <p className="mt-2 text-zinc-400">
              Build your personal trading checklist. Enforce discipline on every trade and track compliance over time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: Trade Info + Controls */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="p-5 space-y-4">
                <CardTitle className="text-base">Trade Setup</CardTitle>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Currency Pair</label>
                  <select
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
                  >
                    {PAIR_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Direction</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["", "buy", "sell"] as const).map((d) => (
                      <button
                        key={d || "none"}
                        onClick={() => setDirection(d)}
                        className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                          direction === d
                            ? d === "buy"
                              ? "bg-green-600 border-green-500 text-white"
                              : d === "sell"
                              ? "bg-red-600 border-red-500 text-white"
                              : "bg-zinc-700 border-zinc-600 text-zinc-100"
                            : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {d === "" ? "None" : d === "buy" ? "Buy" : "Sell"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors text-sm"
                    placeholder="Why are you taking this trade?"
                  />
                </div>
              </Card>

              {/* Progress Card */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-base">Completion</CardTitle>
                  <span className={`text-2xl font-bold font-mono ${completionPercent >= 80 ? "text-green-400" : completionPercent >= 50 ? "text-amber-400" : "text-red-400"}`}>
                    {completionPercent}%
                  </span>
                </div>

                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completionPercent >= 80 ? "bg-green-500" : completionPercent >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Checked</span>
                    <span>{checkedItems.length} / {totalItems}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Required passed</span>
                    <span className={allRequiredPassed ? "text-green-400" : "text-red-400"}>
                      {requiredChecked.length} / {requiredItems.length}
                    </span>
                  </div>
                </div>

                {!allRequiredPassed && (
                  <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 mb-3">
                    <p className="text-xs text-red-400">
                      <strong>{requiredItems.length - requiredChecked.length}</strong> required item(s) not checked.
                      Complete all required items before trading.
                    </p>
                  </div>
                )}

                {allRequiredPassed && (
                  <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 mb-3">
                    <p className="text-xs text-green-400">&#10003; All required conditions met. You may trade.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button onClick={handleSubmit} fullWidth>
                    Save &#38; Clear
                  </Button>
                  <Button variant="secondary" onClick={handleReset} fullWidth>
                    Clear Checks
                  </Button>
                </div>
              </Card>

              {/* Edit controls */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Manage Checklist</CardTitle>
                  <button
                    onClick={() => setIsEditMode((v) => !v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      isEditMode
                        ? "bg-accent-600 border-accent-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {isEditMode ? "Done Editing" : "Edit Items"}
                  </button>
                </div>
                {isEditMode && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <input
                        className="w-full px-3 py-2 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-sm transition-colors"
                        placeholder="New checklist item..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value as ChecklistItem["category"])}
                          className="px-2 py-1.5 bg-neutral-900 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:border-accent-500 focus:outline-none"
                        >
                          {Object.entries(CATEGORY_STYLES).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newItemRequired}
                            onChange={(e) => setNewItemRequired(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-600 bg-neutral-900 accent-indigo-500"
                          />
                          <span className="text-xs text-zinc-400">Required</span>
                        </label>
                      </div>
                      <Button size="small" onClick={handleAddItem} fullWidth>
                        Add Item
                      </Button>
                    </div>
                    <button
                      onClick={handleResetChecklist}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Reset to defaults
                    </button>
                  </div>
                )}
              </Card>
            </div>

            {/* Main: Checklist Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("checklist")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "checklist" ? "bg-accent-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"}`}
                >
                  Checklist ({totalItems})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "history" ? "bg-accent-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"}`}
                >
                  History ({history.length})
                </button>
              </div>

              {activeTab === "checklist" ? (
                <div className="space-y-4">
                  {(Object.keys(CATEGORY_STYLES) as ChecklistItem["category"][]).map((category) => {
                    const items = groupedChecklist[category];
                    if (!items || items.length === 0) return null;
                    const style = CATEGORY_STYLES[category];
                    return (
                      <Card key={category} className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.bg} ${style.color} ${style.border} border`}>
                            {style.label.toUpperCase()}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {items.filter((i) => checkedItems.includes(i.id)).length}/{items.length} checked
                          </span>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <ChecklistItemRow
                              key={item.id}
                              item={item}
                              checked={checkedItems.includes(item.id)}
                              onToggle={handleToggle}
                              onDelete={handleDeleteItem}
                              onEdit={handleEditItem}
                              isEditMode={isEditMode}
                            />
                          ))}
                        </div>
                      </Card>
                    );
                  })}

                  {checklist.length === 0 && (
                    <Card className="text-center py-12">
                      <p className="text-zinc-400">Your checklist is empty.</p>
                      <p className="text-sm text-zinc-500 mt-1">Click &#34;Edit Items&#34; to add items.</p>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <Card className="text-center py-12">
                      <p className="text-zinc-400">No history yet.</p>
                      <p className="text-sm text-zinc-500 mt-1">Complete a checklist and save it to see your history here.</p>
                    </Card>
                  ) : (
                    <>
                      {/* Stats Summary */}
                      <Card className="p-4">
                        <CardTitle className="text-base mb-3">Compliance Overview</CardTitle>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-zinc-500">Total Checks</p>
                            <p className="text-xl font-bold text-zinc-100">{history.length}</p>
                          </div>
                          <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-zinc-500">Passed</p>
                            <p className="text-xl font-bold text-green-400">{history.filter((s) => s.completed).length}</p>
                          </div>
                          <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-zinc-500">Avg Score</p>
                            <p className="text-xl font-bold text-amber-400">
                              {history.length > 0
                                ? Math.round(history.reduce((a, s) => a + (s.checkedItems.length / totalItems) * 100, 0) / history.length)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </Card>

                      {history.map((session) => (
                        <HistoryCard key={session.id} session={session} totalItems={totalItems || 1} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
