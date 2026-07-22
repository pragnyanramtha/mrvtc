"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchStudents, StudentSuggestion } from "@/actions/search-students";
import { Search, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentSearchProps {
    /** Called with the chosen roll number (from a suggestion or a raw submit). */
    onSelect: (rollNo: string, displayName?: string) => void;
    isPending: boolean;
    /** Placeholder + submit-button label vary per tab. */
    placeholder?: string;
    submitLabel?: string;
}

export default function StudentSearch({
    onSelect,
    isPending,
    placeholder = "Name or Roll No.",
    submitLabel = "CHECK",
}: StudentSearchProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<StudentSuggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIdx, setHighlightedIdx] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSuggestions = useCallback((value: string) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        if (value.trim().length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }
        debounceTimer.current = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchStudents(value);
            setSuggestions(results);
            setShowDropdown(results.length > 0);
            setHighlightedIdx(-1);
            setIsSearching(false);
        }, 300);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        fetchSuggestions(val);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectSuggestion = (s: StudentSuggestion) => {
        setQuery(s.fullName);
        setSuggestions([]);
        setShowDropdown(false);
        onSelect(s.rollNumber, s.fullName);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        if (highlightedIdx >= 0 && suggestions[highlightedIdx]) {
            selectSuggestion(suggestions[highlightedIdx]);
            return;
        }
        const trimmed = query.trim().toUpperCase();
        setShowDropdown(false);
        onSelect(trimmed);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIdx(i => Math.max(i - 1, -1));
        } else if (e.key === "Escape") {
            setShowDropdown(false);
            setHighlightedIdx(-1);
        }
    };

    return (
        <div className="w-full max-w-lg relative z-20">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-2xl opacity-30 group-hover:opacity-100 transition duration-500 blur-lg group-focus-within:opacity-100 group-focus-within:blur-xl" />
                <div className="relative flex items-center bg-black/90 backdrop-blur-xl rounded-2xl border border-slate-800 focus-within:border-cyan-500/50 transition-colors shadow-2xl">
                    {isSearching ? (
                        <Loader2 className="h-5 w-5 text-cyan-500 ml-4 flex-shrink-0 animate-spin" />
                    ) : (
                        <Search className="h-5 w-5 text-slate-500 ml-4 flex-shrink-0" />
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                        placeholder={placeholder}
                        autoComplete="off"
                        className="w-full bg-transparent px-4 py-4 text-base md:text-lg text-white placeholder-slate-600 focus:outline-none focus:ring-0 tracking-wide font-mono uppercase"
                    />
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-shrink-0 mr-2 px-3 md:px-5 py-2 bg-slate-900 hover:bg-slate-800 hover:text-cyan-300 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-800 hover:border-cyan-500/30"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
                    </button>
                </div>
            </form>

            <AnimatePresence>
                {showDropdown && suggestions.length > 0 && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-slate-700/60 rounded-xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] z-50"
                    >
                        {suggestions.map((s, idx) => (
                            <button
                                key={s.rollNumber}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                                onMouseEnter={() => setHighlightedIdx(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 ${
                                    highlightedIdx === idx
                                        ? "bg-cyan-500/10 border-l-2 border-cyan-500"
                                        : "border-l-2 border-transparent hover:bg-slate-800/60"
                                } ${idx !== 0 ? "border-t border-slate-800/60" : ""}`}
                            >
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                                    highlightedIdx === idx ? "bg-cyan-500/20" : "bg-slate-800"
                                }`}>
                                    <User className={`w-3.5 h-3.5 ${highlightedIdx === idx ? "text-cyan-400" : "text-slate-500"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold truncate ${highlightedIdx === idx ? "text-white" : "text-slate-200"}`}>
                                        {s.fullName}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                                        {s.rollNumber}
                                    </div>
                                </div>
                                {highlightedIdx === idx && (
                                    <div className="flex-shrink-0 text-[9px] text-cyan-500/60 font-mono uppercase tracking-wider">
                                        Enter ↵
                                    </div>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
