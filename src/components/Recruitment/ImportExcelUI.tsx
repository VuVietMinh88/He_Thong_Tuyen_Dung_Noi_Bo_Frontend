import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

interface ImportEmployeeRow {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: "valid" | "invalid";
  error?: string;
}

const mockRows: ImportEmployeeRow[] = [
  {
    id: 1,
    fullName: "Nguyễn Văn An",
    email: "an.nguyen@smartrecruitment.vn",
    phone: "0909123456",
    role: "Product Designer",
    status: "valid",
  },
  {
    id: 2,
    fullName: "Trần Thị Bích",
    email: "bich.tran@smartrecruitment.vn",
    phone: "0988123456",
    role: "Business Analyst",
    status: "valid",
  },
  {
    id: 3,
    fullName: "Lê Hoàng Nam",
    email: "hoangnam.email",
    phone: "0912345678",
    role: "Frontend Developer",
    status: "invalid",
    error: "Email không đúng định dạng. Vui lòng kiểm tra lại.",
  },
  {
    id: 4,
    fullName: "Phạm Minh Châu",
    email: "chau.pham@smartrecruitment.vn",
    phone: "abcxyz",
    role: "QA Engineer",
    status: "invalid",
    error: "Số điện thoại không hợp lệ.",
  },
];

const formatStatusPill = (status: ImportEmployeeRow["status"]) => {
  if (status === "valid") {
    return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  }

  return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
};

const formatStatusLabel = (status: ImportEmployeeRow["status"]) => {
  if (status === "valid") {
    return "Hợp lệ";
  }

  return "Lỗi dữ liệu";
};

const ImportExcelUI = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState(
    "danhsach_nhansu.xlsx",
  );
  const [rows, setRows] = useState<ImportEmployeeRow[]>(mockRows);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const validCount = rows.filter((row) => row.status === "valid").length;
  const invalidCount = rows.length - validCount;

  const handleFileSelection = (file?: File) => {
    if (!file) return;

    setIsLoadingFile(true);
    setSelectedFileName(file.name);

    window.setTimeout(() => {
      setIsLoadingFile(false);
    }, 500);
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

  const handleCancel = () => {
    setSelectedFileName("");
    setRows(mockRows);
    setIsLoadingFile(false);
  };

  const canConfirmImport = validCount > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
          className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          type="button"
        >
          Tải file mẫu
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={`group rounded-2xl border-2 border-dashed p-5 transition duration-200 ${
          isDragActive
            ? "border-indigo-400 bg-indigo-50 shadow-inner"
            : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
        }`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-600">
            ⬆️
          </div>

          <div>
            <p className="text-base font-semibold text-slate-800">
              Kéo thả file Excel vào đây
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Hỗ trợ định dạng .xlsx, .xls
            </p>
          </div>

          <button
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Chọn file
          </button>

          <input
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleInputChange}
            ref={inputRef}
            type="file"
          />

          <div className="flex min-h-7 items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            {isLoadingFile
              ? "Đang xử lý file..."
              : selectedFileName || "Chưa có file nào được chọn"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Tổng số dòng</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {rows.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Hợp lệ</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {validCount}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">Lỗi</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">
            {invalidCount}
          </p>
        </div>
      </div>

      {/* Table Preview */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                  STT
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                  Họ tên
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                  Số điện thoại
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                  Vai trò
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    row.status === "invalid" ? "bg-rose-50/70" : "bg-white"
                  }
                >
                  <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {row.id}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {row.fullName}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {row.email}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {row.phone}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {row.role}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${formatStatusPill(row.status)}`}
                    >
                      {formatStatusLabel(row.status)}
                    </span>
                    {row.status === "invalid" && row.error && (
                      <p className="mt-2 text-[11px] font-medium text-rose-600">
                        {row.error}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={handleCancel}
          type="button"
        >
          Hủy bỏ
        </button>
        <button
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canConfirmImport}
          type="button"
        >
          Xác nhận Import
        </button>
      </div>
    </section>
  );
};

export default ImportExcelUI;
