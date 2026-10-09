import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  importService,
  validateImportFile,
  getApiErrorMessage,
  type PreviewResponse,
  type PreviewRow,
  type ImportReport,
} from "../../services/import.service";
import { useToast } from "../notifications/useToast";

export interface ImportExcelUIProps {
  onSuccess?: (report: ImportReport) => void;
  onClose?: () => void;
}

type FilterTab = "all" | "valid" | "invalid";

const formatStatusPill = (valid: boolean) => {
  if (valid) {
    return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  }
  return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
};

const formatStatusLabel = (valid: boolean) => {
  if (valid) {
    return "Hợp lệ";
  }
  return "Lỗi dữ liệu";
};

export const ImportExcelUI = ({ onSuccess, onClose }: ImportExcelUIProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { notify } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const totalRows = previewData?.totalRows ?? 0;
  const validCount = previewData?.validRows ?? 0;
  const invalidCount = previewData?.invalidRows ?? 0;

  const filteredRows: PreviewRow[] = (previewData?.rows ?? []).filter((row) => {
    if (filterTab === "valid") return row.valid;
    if (filterTab === "invalid") return !row.valid;
    return true;
  });

  const handleFileSelection = async (file?: File) => {
    if (!file) return;

    setErrorMessage(null);
    setImportReport(null);

    const validationErr = validateImportFile(file);
    if (validationErr) {
      setErrorMessage(validationErr);
      notify(validationErr, "error");
      setSelectedFile(null);
      setSelectedFileName("");
      setPreviewData(null);
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setIsLoadingPreview(true);

    try {
      const data = await importService.preview(file);
      setPreviewData(data);
      if (data.invalidRows === 0) {
        notify(
          `Đã kiểm tra tệp: toàn bộ ${data.totalRows} dòng đều hợp lệ và sẵn sàng nhập.`,
          "success",
        );
      } else {
        notify(
          `Đã đọc ${data.totalRows} dòng: ${data.validRows} hợp lệ, ${data.invalidRows} dòng có lỗi cần kiểm tra.`,
          "warning",
        );
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Không thể đọc và phân tích tệp Excel. Vui lòng kiểm tra lại.",
      );
      setErrorMessage(message);
      setPreviewData(null);
      notify(message, "error");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileSelection(file);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    handleFileSelection(file);
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await importService.triggerTemplateDownload();
      notify("Đã tải xuống tệp Excel mẫu thành công.", "success");
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Không thể tải tệp mẫu. Vui lòng thử lại sau.",
      );
      notify(message, "error");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !previewData || validCount === 0) return;

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const report = await importService.importFile(selectedFile);
      setImportReport(report);

      if (report.createdCount > 0) {
        notify(
          `Nhập thành công ${report.createdCount}/${report.totalRows} tài khoản nhân sự.`,
          "success",
        );
        onSuccess?.(report);
      } else {
        notify(
          "Không có tài khoản nào được tạo. Vui lòng xem chi tiết các dòng bị bỏ qua.",
          "warning",
        );
      }

      if (report.stoppedAtRow) {
        notify(
          `Máy chủ gửi email mời gặp sự cố ở dòng ${report.stoppedAtRow}. Quá trình nhập đã dừng lại.`,
          "error",
        );
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Quá trình nhập dữ liệu thất bại. Vui lòng kiểm tra lại.",
      );
      setErrorMessage(message);
      notify(message, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedFileName("");
    setPreviewData(null);
    setImportReport(null);
    setErrorMessage(null);
    setFilterTab("all");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    handleReset();
    onClose?.();
  };

  const canConfirmImport = Boolean(
    selectedFile && previewData && validCount > 0 && !isLoadingPreview && !isImporting,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-indigo-600">
            Import nhân sự
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Nhập danh sách nhân sự từ Excel
          </h2>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isDownloadingTemplate}
          onClick={handleDownloadTemplate}
          type="button"
        >
          {isDownloadingTemplate ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-700 border-t-transparent" />
              <span>Đang tải tệp mẫu...</span>
            </>
          ) : (
            <>
              <span>📥</span>
              <span>Tải file mẫu</span>
            </>
          )}
        </button>
      </div>

      {/* Global Error Message Banner */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold">Đã xảy ra lỗi:</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            className="text-xs font-semibold text-rose-600 hover:text-rose-900"
            onClick={() => setErrorMessage(null)}
            type="button"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Import Result Report Banner */}
      {importReport && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {importReport.createdCount > 0 ? "🎉" : "⚠️"}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Kết quả nhập dữ liệu
                </h3>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Đã xử lý xong tệp: <strong>{importReport.createdCount}</strong>{" "}
                tài khoản tạo thành công,{" "}
                <strong>{importReport.skippedCount}</strong> dòng bị bỏ qua /
                lỗi trên tổng số <strong>{importReport.totalRows}</strong> dòng.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={handleReset}
                type="button"
              >
                Nhập tệp mới
              </button>
            </div>
          </div>

          {importReport.stoppedAtRow && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
              <p className="font-bold">⚠️ Quá trình nhập dừng giữa chừng:</p>
              <p className="mt-1">
                Máy chủ gửi email mời gặp sự cố ở dòng {importReport.stoppedAtRow}.
                Các dòng hợp lệ tiếp theo chưa được xử lý. Bạn có thể kiểm tra lại
                máy chủ gửi thư và tải lại tệp này (hệ thống sẽ tự động bỏ qua các
                tài khoản đã tạo trước đó).
              </p>
            </div>
          )}

          {importReport.skipped.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Danh sách {importReport.skipped.length} dòng bị bỏ qua:
              </p>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-rose-200 bg-white p-3 text-xs space-y-2">
                {importReport.skipped.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="font-semibold text-slate-800">
                      Dòng {item.rowNumber}
                      {item.email ? ` (${item.email})` : ""}:
                    </span>
                    <ul className="mt-1 list-disc list-inside text-rose-600 space-y-0.5">
                      {item.errors?.map((err, errIdx) => (
                        <li key={errIdx}>
                          {err.cell ? `[Ô ${err.cell}] ` : ""}
                          {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        className={`group rounded-2xl border-2 border-dashed p-6 transition duration-200 ${
          isDragActive
            ? "border-indigo-400 bg-indigo-50 shadow-inner"
            : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
        }`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-600">
            {isLoadingPreview ? "⏳" : "⬆️"}
          </div>

          <div>
            <p className="text-base font-semibold text-slate-800">
              {isLoadingPreview
                ? "Đang đọc và kiểm tra tệp Excel..."
                : "Kéo thả file Excel vào đây hoặc bấm để chọn"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Định dạng hỗ trợ: <strong>.xlsx</strong> (Tối đa 2MB, tối đa 500 dòng nhân sự)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoadingPreview || isImporting}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              Chọn file
            </button>
            {selectedFileName && (
              <button
                className="text-xs font-semibold text-slate-500 hover:text-rose-600"
                onClick={handleReset}
                type="button"
              >
                Xóa file
              </button>
            )}
          </div>

          <input
            accept=".xlsx"
            className="hidden"
            disabled={isLoadingPreview || isImporting}
            onChange={handleInputChange}
            ref={inputRef}
            type="file"
          />

          <div className="flex min-h-7 items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600">
            {isLoadingPreview ? (
              <span className="flex items-center gap-2 text-indigo-600 font-semibold">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                Đang xử lý và kiểm tra dữ liệu qua API...
              </span>
            ) : selectedFileName ? (
              <span className="text-slate-800 font-medium">
                📄 {selectedFileName}{" "}
                {selectedFile
                  ? `(${(selectedFile.size / 1024).toFixed(1)} KB)`
                  : ""}
              </span>
            ) : (
              "Chưa có file nào được chọn"
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">Tổng số dòng</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalRows}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">Hợp lệ</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {validCount}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-700">Lỗi</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">
            {invalidCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs for Preview Table */}
      {previewData && totalRows > 0 && (
        <div className="mt-6 flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterTab === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => setFilterTab("all")}
              type="button"
            >
              Tất cả ({totalRows})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterTab === "valid"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
              onClick={() => setFilterTab("valid")}
              type="button"
            >
              Hợp lệ ({validCount})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterTab === "invalid"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
              onClick={() => setFilterTab("invalid")}
              type="button"
            >
              Có lỗi ({invalidCount})
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Hiển thị {filteredRows.length} dòng
          </p>
        </div>
      )}

      {/* Table Preview */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Dòng Excel
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Họ tên
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Số điện thoại
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Vai trò
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Phòng ban
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Chức danh
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const hasEmailError = row.errors?.some((e) => e.column === "email");
                  const hasNameError = row.errors?.some((e) => e.column === "fullName");
                  const hasPhoneError = row.errors?.some((e) => e.column === "phone");
                  const hasRolesError = row.errors?.some((e) => e.column === "roles");
                  const hasDeptError = row.errors?.some((e) => e.column === "departmentCode");
                  const hasTitleError = row.errors?.some((e) => e.column === "displayTitle");

                  return (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.valid
                          ? "bg-white hover:bg-slate-50/70"
                          : "bg-rose-50/50 hover:bg-rose-50/80"
                      }
                    >
                      <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                        Dòng {row.rowNumber}
                      </td>
                      <td
                        className={`border-t border-slate-200 px-4 py-3 text-sm ${
                          hasNameError
                            ? "font-medium text-rose-700 bg-rose-100/40"
                            : "text-slate-800"
                        }`}
                      >
                        {row.fullName || (
                          <span className="text-slate-400 italic">Trống</span>
                        )}
                      </td>
                      <td
                        className={`border-t border-slate-200 px-4 py-3 text-sm ${
                          hasEmailError
                            ? "font-medium text-rose-700 bg-rose-100/40"
                            : "text-slate-800"
                        }`}
                      >
                        {row.email || (
                          <span className="text-slate-400 italic">Trống</span>
                        )}
                      </td>
                      <td
                        className={`border-t border-slate-200 px-4 py-3 text-sm ${
                          hasPhoneError
                            ? "font-medium text-rose-700 bg-rose-100/40"
                            : "text-slate-700"
                        }`}
                      >
                        {row.phone || <span className="text-slate-400">—</span>}
                      </td>
                      <td
                        className={`border-t border-slate-200 px-4 py-3 text-sm ${
                          hasRolesError ? "bg-rose-100/40" : ""
                        }`}
                      >
                        {row.roles && row.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.roles.map((role) => (
                              <span
                                key={role}
                                className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                                  hasRolesError
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-indigo-50 text-indigo-700"
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có</span>
                        )}
                      </td>
                      <td
                        className={`border-t border-slate-200 px-4 py-3 text-sm ${
                          hasDeptError
                            ? "font-medium text-rose-700 bg-rose-100/40"
                            : "text-slate-700"
                        }`}
                      >
                        {row.departmentCode || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className={`border-t border-slate-200 px-4 py-3 text-sm ${
                          hasTitleError
                            ? "font-medium text-rose-700 bg-rose-100/40"
                            : "text-slate-700"
                        }`}
                      >
                        {row.displayTitle || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${formatStatusPill(row.valid)}`}
                        >
                          {formatStatusLabel(row.valid)}
                        </span>
                        {!row.valid && row.errors && row.errors.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {row.errors.map((err, errIdx) => (
                              <p
                                key={errIdx}
                                className="text-[11px] font-medium text-rose-600"
                              >
                                {err.cell ? `[${err.cell}] ` : ""}
                                {err.message}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
                    colSpan={8}
                  >
                    {isLoadingPreview ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        Đang đọc và phân tích tệp Excel từ Backend...
                      </span>
                    ) : selectedFile ? (
                      filterTab !== "all"
                        ? "Không có dòng nào phù hợp với bộ lọc hiện tại."
                        : "Tệp Excel không có dòng dữ liệu nhân sự nào."
                    ) : (
                      "Chưa có dữ liệu. Vui lòng kéo thả hoặc chọn tệp Excel (.xlsx) để xem trước."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          disabled={isImporting}
          onClick={handleCancel}
          type="button"
        >
          Hủy bỏ
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canConfirmImport}
          onClick={handleConfirmImport}
          type="button"
        >
          {isImporting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Đang nhập dữ liệu...</span>
            </>
          ) : (
            <span>
              Xác nhận Import {validCount > 0 ? `(${validCount} nhân sự)` : ""}
            </span>
          )}
        </button>
      </div>
    </section>
  );
};

export default ImportExcelUI;
