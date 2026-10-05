import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiImage,
  FiRotateCcw,
  FiRotateCw,
  FiMinus,
} from "react-icons/fi";
import { MdFormatListNumbered, MdFormatClear, MdTableChart } from "react-icons/md";
import { BiHeading } from "react-icons/bi";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Type your assignment instructions here...",
  minHeight = "260px",
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Sync value from props into editor only when external change occurs (e.g. loading draft)
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        // If content is empty or different from external, update innerHTML
        if (value === "" || value === undefined || value === null) {
          editorRef.current.innerHTML = "";
        } else if (document.activeElement !== editorRef.current) {
          editorRef.current.innerHTML = value;
        }
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html === "<p><br></p>" || html === "<br>" || html === "<p></p>") {
        onChange("");
      } else {
        onChange(html);
      }
    }
  }, [onChange]);

  // Execute a document command
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelection(sel.getRangeAt(0));
    }
  };

  const restoreSelection = () => {
    if (savedSelection) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelection);
      }
    }
  };

  // Open Link Modal
  const openLinkDialog = () => {
    saveCurrentSelection();
    const sel = window.getSelection();
    setLinkText(sel ? sel.toString() : "");
    setLinkUrl("");
    setShowLinkModal(true);
  };

  // Confirm Link
  const applyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setShowLinkModal(false);
      return;
    }
    restoreSelection();
    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (linkText.trim()) {
      const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="text-brand-500 underline font-medium hover:text-brand-600">${linkText.trim()}</a>`;
      execCmd("insertHTML", linkHtml);
    } else {
      execCmd("createLink", finalUrl);
    }
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Open Image Modal
  const openImageDialog = () => {
    saveCurrentSelection();
    setImageUrl("");
    setImageAlt("");
    setShowImageModal(true);
  };

  // Confirm Image
  const applyImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setShowImageModal(false);
      return;
    }
    restoreSelection();
    const imgHtml = `<figure class="my-3 text-center"><img src="${imageUrl.trim()}" alt="${imageAlt.trim() || "Assignment asset"}" class="max-w-full max-h-96 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mx-auto inline-block" />${imageAlt.trim() ? `<figcaption class="text-xs text-gray-500 mt-1 italic">${imageAlt.trim()}</figcaption>` : ""}</figure><p><br></p>`;
    execCmd("insertHTML", imgHtml);
    setShowImageModal(false);
    setImageUrl("");
    setImageAlt("");
  };

  // Open Table Modal
  const openTableDialog = () => {
    saveCurrentSelection();
    setShowTableModal(true);
  };

  // Confirm Table
  const applyTable = (e: React.FormEvent) => {
    e.preventDefault();
    restoreSelection();
    const rows = Math.max(1, Math.min(tableRows, 15));
    const cols = Math.max(1, Math.min(tableCols, 10));

    let tableHtml = `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 dark:border-gray-700 text-sm"><thead><tr>`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th class="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2 font-semibold text-left">Header ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td class="border border-gray-300 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-300">Data ${r}-${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div><p><br></p>`;

    execCmd("insertHTML", tableHtml);
    setShowTableModal(false);
  };

  // Calculate word count
  const getWordCount = () => {
    if (!editorRef.current) return 0;
    const text = editorRef.current.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  };

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-xs focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 select-none">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-gray-200 dark:border-gray-700">
          <button
            type="button"
            title="Heading 1"
            disabled={disabled}
            onClick={() => execCmd("formatBlock", "<h1>")}
            className="p-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            H1
          </button>
          <button
            type="button"
            title="Heading 2"
            disabled={disabled}
            onClick={() => execCmd("formatBlock", "<h2>")}
            className="p-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            H2
          </button>
          <button
            type="button"
            title="Heading 3"
            disabled={disabled}
            onClick={() => execCmd("formatBlock", "<h3>")}
            className="p-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            H3
          </button>
          <button
            type="button"
            title="Normal Paragraph"
            disabled={disabled}
            onClick={() => execCmd("formatBlock", "<p>")}
            className="p-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            P
          </button>
        </div>

        {/* Text Styles */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 dark:border-gray-700">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            disabled={disabled}
            onClick={() => execCmd("bold")}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            <FiBold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            disabled={disabled}
            onClick={() => execCmd("italic")}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            <FiItalic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            disabled={disabled}
            onClick={() => execCmd("underline")}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            <FiUnderline className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 dark:border-gray-700">
          <button
            type="button"
            title="Bullet List"
            disabled={disabled}
            onClick={() => execCmd("insertUnorderedList")}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            <FiList className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            disabled={disabled}
            onClick={() => execCmd("insertOrderedList")}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            <MdFormatListNumbered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Horizontal Divider"
            disabled={disabled}
            onClick={() => execCmd("insertHorizontalRule")}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition"
          >
            <FiMinus className="w-4 h-4" />
          </button>
        </div>

        {/* Rich Elements: Link, Image, Table */}
        <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 dark:border-gray-700">
          <button
            type="button"
            title="Insert Link"
            disabled={disabled}
            onClick={openLinkDialog}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition flex items-center gap-1 text-xs"
          >
            <FiLink className="w-4 h-4 text-brand-500" />
            <span className="hidden sm:inline">Link</span>
          </button>
          <button
            type="button"
            title="Insert Image"
            disabled={disabled}
            onClick={openImageDialog}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition flex items-center gap-1 text-xs"
          >
            <FiImage className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Image</span>
          </button>
          <button
            type="button"
            title="Insert Table"
            disabled={disabled}
            onClick={openTableDialog}
            className="p-1.5 text-gray-700 dark:text-gray-200 rounded hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs transition flex items-center gap-1 text-xs"
          >
            <MdTableChart className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>

        {/* Clear formatting, Undo & Redo */}
        <div className="flex items-center gap-0.5 px-1 ml-auto">
          <button
            type="button"
            title="Clear Formatting"
            disabled={disabled}
            onClick={() => execCmd("removeFormat")}
            className="p-1.5 text-gray-500 dark:text-gray-400 rounded hover:bg-white dark:hover:bg-gray-700 hover:text-red-500 transition"
          >
            <MdFormatClear className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Undo"
            disabled={disabled}
            onClick={() => execCmd("undo")}
            className="p-1.5 text-gray-500 dark:text-gray-400 rounded hover:bg-white dark:hover:bg-gray-700 transition"
          >
            <FiRotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo"
            disabled={disabled}
            onClick={() => execCmd("redo")}
            className="p-1.5 text-gray-500 dark:text-gray-400 rounded hover:bg-white dark:hover:bg-gray-700 transition"
          >
            <FiRotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative p-4">
        {(!value || value === "<p><br></p>" || value === "<br>") && (
          <div className="absolute top-4 left-4 pointer-events-none text-gray-400 dark:text-gray-500 select-none text-sm">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleInput}
          style={{ minHeight }}
          className="rich-text-content outline-none text-gray-800 dark:text-gray-100 text-sm sm:text-base leading-relaxed overflow-y-auto max-h-[500px] prose dark:prose-invert max-w-none"
        />
      </div>

      {/* Editor Footer / Word Count */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 flex justify-between items-center bg-gray-50/40 dark:bg-gray-800/40">
        <span>Rich Text Editor</span>
        <span>{getWordCount()} words</span>
      </div>

      {/* Link Dialog Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in duration-200">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Insert Hyperlink
            </h3>
            <form onSubmit={applyLink} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Read reference article"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/notes"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-xs transition"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Dialog Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in duration-200">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Insert Image
            </h3>
            <form onSubmit={applyImage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image Web URL *
                </label>
                <input
                  type="url"
                  required
                  autoFocus
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or data:image/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caption / Alt Text
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g. Figure 1: Botanical cell diagram"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Dialog Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in duration-200">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Insert Table
            </h3>
            <form onSubmit={applyTable} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                A structured table will be inserted where you can type your tabular data.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition"
                >
                  Insert Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
