import { useCallback, useEffect, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react';
import {
  businessService,
  type CompetencyCriterion,
  type CompetencyCriterionInput,
  type CompetencyFramework,
  type InterviewQuestion,
  type RecruitmentCatalogItem,
} from '../../services/business.service';
import { usePermission } from '../../hooks/usePermission';

export type RecruitmentAdminMode = 'frameworks' | 'questions' | 'catalogs';

const CATALOG_TYPES = [
  ['CANDIDATE_SOURCE', 'Nguồn ứng viên'],
  ['REJECTION_REASON', 'Lý do từ chối'],
  ['WORK_LOCATION', 'Địa điểm làm việc'],
  ['EMPLOYMENT_TYPE', 'Hình thức làm việc'],
] as const;
type FrameworkSummary = Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'status'> & { criterionCount: number };

const RecruitmentAdminPage = ({ mode }: { mode: RecruitmentAdminMode }) => {
  const { permissions } = usePermission();
  const canWrite = permissions.includes('ORGANIZATION_WRITE_ALL');
  const [frameworks, setFrameworks] = useState<FrameworkSummary[]>([]);
  const [framework, setFramework] = useState<CompetencyFramework | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [catalogItems, setCatalogItems] = useState<RecruitmentCatalogItem[]>([]);
  const [catalogType, setCatalogType] = useState<string>(CATALOG_TYPES[0][0]);
  const [criteria, setCriteria] = useState<CompetencyCriterion[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [frameworkId, setFrameworkId] = useState('');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');
  const [criterionRows, setCriterionRows] = useState<CriterionForm[]>([]);
  const [criterionId, setCriterionId] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<InterviewQuestion['difficulty']>('MEDIUM');
  const [answerHint, setAnswerHint] = useState('');
  const [active, setActive] = useState(true);

  const fetchData = useCallback(async () => {
    if (mode === 'frameworks' || mode === 'questions') {
      const frameworkPage = await businessService.getFrameworks();
      const questionPage = mode === 'questions' ? await businessService.getQuestions() : null;
      return { frameworkItems: frameworkPage.items, questionItems: questionPage?.items ?? null, catalogValues: null };
    }
    return { frameworkItems: null, questionItems: null, catalogValues: await businessService.getCatalog(catalogType) };
  }, [mode, catalogType]);

  useEffect(() => {
    let current = true;
    fetchData()
      .then((data) => {
        if (!current) return;
        if (data.frameworkItems) setFrameworks(data.frameworkItems);
        if (data.questionItems) setQuestions(data.questionItems);
        if (data.catalogValues) setCatalogItems(data.catalogValues);
      })
      .catch((loadError: unknown) => {
        if (current) setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu.');
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [fetchData]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchData();
      if (data.frameworkItems) setFrameworks(data.frameworkItems);
      if (data.questionItems) setQuestions(data.questionItems);
      if (data.catalogValues) setCatalogItems(data.catalogValues);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!frameworkId || mode !== 'questions') return;
    let current = true;
    businessService.getFramework(frameworkId)
      .then((result) => { if (current) setCriteria(result.criteria); })
      .catch((loadError: unknown) => {
        if (current) setError(loadError instanceof Error ? loadError.message : 'Không thể tải tiêu chí.');
      });
    return () => { current = false; };
  }, [frameworkId, mode]);

  const resetForm = () => {
    setShowForm(false);
    setFramework(null);
    setQuestionId(null);
    setCatalogId(null);
    setCriterionRows([]);
    setCode('');
    setName('');
    setDescription('');
    setStatus('DRAFT');
    setFrameworkId('');
    setCriterionId('');
    setContent('');
    setDifficulty('MEDIUM');
    setAnswerHint('');
    setActive(true);
  };

  const editFramework = async (id?: string) => {
    setError('');
    try {
      const existing = id ? await businessService.getFramework(id) : null;
      setFramework(existing);
      setCode(existing?.code ?? '');
      setName(existing?.name ?? '');
      setDescription(existing?.description ?? '');
      setStatus(existing?.status ?? 'DRAFT');
      setCriterionRows(existing?.criteria.map((criterion) => ({
        id: criterion.id, name: criterion.name, description: criterion.description ?? '', weight: String(criterion.weight),
      })) ?? []);
      setShowForm(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải khung năng lực.');
    }
  };

  const submitFramework = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await businessService.saveFramework(framework?.id ?? null, {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || null,
        status,
        criteria: criterionRows.map((criterion): CompetencyCriterionInput => ({
          ...(criterion.id ? { id: criterion.id } : {}),
          name: criterion.name.trim(),
          description: criterion.description.trim() || null,
          weight: Number(criterion.weight),
        })),
      });
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu khung năng lực.');
    } finally {
      setSaving(false);
    }
  };

  const editQuestion = (item?: InterviewQuestion) => {
    const matchingFramework = item?.framework.id ?? '';
    setCriteria([]);
    setFrameworkId(matchingFramework);
    setQuestionId(item?.id ?? null);
    setCriterionId(item?.criterion.id ?? '');
    setContent(item?.content ?? '');
    setDifficulty(item?.difficulty ?? 'MEDIUM');
    setAnswerHint(item?.answerHint ?? '');
    setActive(item?.active ?? true);
    setShowForm(true);
  };

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const selectedCriterion = criteria.find((criterion) => criterion.id === criterionId);
      if (!selectedCriterion) throw new Error('Hãy chọn tiêu chí đánh giá hợp lệ.');
      await businessService.saveQuestion(questionId, {
        criterion: { id: selectedCriterion.id, name: selectedCriterion.name },
        content: content.trim(),
        difficulty,
        answerHint: answerHint.trim() || null,
        active,
      });
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  const editCatalog = (item?: RecruitmentCatalogItem) => {
    setCatalogId(item?.id ?? null);
    setCode(item?.code ?? '');
    setName(item?.name ?? '');
    setActive(item?.active ?? true);
    setShowForm(true);
  };

  const submitCatalog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await businessService.saveCatalogItem(catalogType, catalogId, { code: code.trim(), name: name.trim(), active });
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu danh mục.');
    } finally {
      setSaving(false);
    }
  };

  const removeCatalogItem = async (item: RecruitmentCatalogItem) => {
    if (!window.confirm(`Xóa giá trị "${item.name}"? Nếu đang được sử dụng, Backend sẽ từ chối thao tác.`)) return;
    setError('');
    try {
      await businessService.deleteCatalogItem(catalogType, item.id);
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Không thể xóa giá trị danh mục.');
    }
  };

  const title = mode === 'frameworks' ? 'Khung năng lực & tiêu chí' : mode === 'questions' ? 'Ngân hàng câu hỏi phỏng vấn' : 'Danh mục tuyển dụng';

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">Quản lý trực tiếp qua các API Backend.</p></div>
        {!showForm && canWrite && (
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => {
            if (mode === 'frameworks') void editFramework();
            else if (mode === 'questions') editQuestion();
            else editCatalog();
          }} type="button">
            {mode === 'frameworks' ? 'Tạo khung năng lực' : mode === 'questions' ? 'Thêm câu hỏi' : 'Thêm giá trị'}
          </button>
        )}
      </header>
      {mode === 'catalogs' && <label className="block max-w-md text-sm font-medium text-slate-700">Loại danh mục
        <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={catalogType} onChange={(event) => { resetForm(); setLoading(true); setError(''); setCatalogType(event.target.value); }}>
          {CATALOG_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</div>}

      {showForm && mode === 'frameworks' && <form className="space-y-4 rounded-xl bg-white p-5 shadow-sm" onSubmit={submitFramework}>
        <h2 className="text-lg font-semibold">{framework ? 'Chỉnh sửa khung năng lực' : 'Tạo khung năng lực'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Mã<input required maxLength={50} value={code} onChange={(event) => setCode(event.target.value)} /></label>
          <label className="field">Tên<input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'ACTIVE')}><option value="DRAFT">Bản nháp</option><option value="ACTIVE">Đang áp dụng</option></select></label>
          <label className="field md:col-span-2">Mô tả<textarea maxLength={1000} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Tiêu chí (tổng trọng số ACTIVE phải bằng 100%)</h3><button className="text-sm font-medium text-indigo-700 underline" onClick={() => setCriterionRows([...criterionRows, { name: '', description: '', weight: '' }])} type="button">Thêm tiêu chí</button></div>
          {criterionRows.map((criterion, index) => <div className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_120px_auto]" key={criterion.id ?? index}>
            <input aria-label="Tên tiêu chí" className="rounded border border-slate-300 px-3 py-2" placeholder="Tên tiêu chí" required value={criterion.name} onChange={(event) => updateCriterion(setCriterionRows, index, 'name', event.target.value)} />
            <input aria-label="Mô tả tiêu chí" className="rounded border border-slate-300 px-3 py-2" placeholder="Mô tả" value={criterion.description} onChange={(event) => updateCriterion(setCriterionRows, index, 'description', event.target.value)} />
            <input aria-label="Trọng số phần trăm" className="rounded border border-slate-300 px-3 py-2" min="0.01" max="100" placeholder="Trọng số %" required step="0.01" type="number" value={criterion.weight} onChange={(event) => updateCriterion(setCriterionRows, index, 'weight', event.target.value)} />
            <button className="text-sm text-rose-700 underline" onClick={() => setCriterionRows(criterionRows.filter((_, rowIndex) => rowIndex !== index))} type="button">Xóa</button>
          </div>)}
        </div>
        <FormActions saving={saving} onCancel={resetForm} />
      </form>}

      {showForm && mode === 'questions' && <form className="grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={submitQuestion}>
        <h2 className="text-lg font-semibold md:col-span-2">{questionId ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi phỏng vấn'}</h2>
        <label className="field">Khung năng lực<select required value={frameworkId} onChange={(event) => { setFrameworkId(event.target.value); setCriterionId(''); }}><option value="">Chọn khung năng lực</option>{frameworks.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.status})</option>)}</select></label>
        <label className="field">Tiêu chí<select required value={criterionId} onChange={(event) => setCriterionId(event.target.value)}><option value="">Chọn tiêu chí</option>{criteria.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="field">Độ khó<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as InterviewQuestion['difficulty'])}><option value="EASY">Dễ</option><option value="MEDIUM">Trung bình</option><option value="HARD">Khó</option></select></label>
        <label className="field md:col-span-2">Nội dung câu hỏi<textarea required maxLength={2000} rows={4} value={content} onChange={(event) => setContent(event.target.value)} /></label>
        <label className="field md:col-span-2">Gợi ý câu trả lời<textarea maxLength={4000} rows={3} value={answerHint} onChange={(event) => setAnswerHint(event.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input checked={active} type="checkbox" onChange={(event) => setActive(event.target.checked)} /> Đang sử dụng</label>
        <FormActions saving={saving} onCancel={resetForm} />
      </form>}

      {showForm && mode === 'catalogs' && <form className="grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={submitCatalog}>
        <h2 className="text-lg font-semibold md:col-span-2">{catalogId ? 'Sửa giá trị danh mục' : 'Thêm giá trị danh mục'}</h2>
        <label className="field">Mã<input required maxLength={50} value={code} onChange={(event) => setCode(event.target.value)} /></label>
        <label className="field">Tên<input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input checked={active} type="checkbox" onChange={(event) => setActive(event.target.checked)} /> Đang áp dụng</label>
        <FormActions saving={saving} onCancel={resetForm} />
      </form>}

      {loading ? <div className="rounded-xl bg-white p-6 text-slate-600" role="status">Đang tải dữ liệu…</div> : mode === 'frameworks'
        ? <DataTable headers={['Mã', 'Khung năng lực', 'Trạng thái', 'Số tiêu chí', 'Thao tác']} rows={frameworks.map((item) => [item.code, item.name, item.status, item.criterionCount, canWrite ? <button className="text-indigo-700 underline" key={item.id} onClick={() => void editFramework(item.id)} type="button">Sửa</button> : '—'])} />
        : mode === 'questions'
          ? <DataTable headers={['Câu hỏi', 'Khung / tiêu chí', 'Độ khó', 'Trạng thái', ...(canWrite ? ['Thao tác'] : [])]} rows={questions.map((item) => [item.content, `${item.framework.name} / ${item.criterion.name}`, difficultyLabel(item.difficulty), item.active ? 'Đang dùng' : 'Tắt', ...(canWrite ? [<button className="text-indigo-700 underline" key={item.id} onClick={() => editQuestion(item)} type="button">Sửa</button>] : [])])} />
          : <DataTable headers={['Mã', 'Tên', 'Thứ tự', 'Trạng thái', ...(canWrite ? ['Thao tác'] : [])]} rows={catalogItems.map((item) => [item.code, item.name, item.sortOrder, item.active ? 'Áp dụng' : 'Tắt', ...(canWrite ? [<span className="flex gap-3" key={item.id}><button className="text-indigo-700 underline" onClick={() => editCatalog(item)} type="button">Sửa</button><button className="text-rose-700 underline" onClick={() => void removeCatalogItem(item)} type="button">Xóa</button></span>] : [])])} />}
    </section>
  );
};

type CriterionForm = { id?: string; name: string; description: string; weight: string };
const updateCriterion = (setRows: Dispatch<SetStateAction<CriterionForm[]>>, index: number, key: keyof CriterionForm, value: string) => {
  setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
};
const difficultyLabel = (difficulty: InterviewQuestion['difficulty']) => ({ EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' })[difficulty];
const FormActions = ({ saving, onCancel }: { saving: boolean; onCancel: () => void }) => <div className="flex gap-2 md:col-span-2">
  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu'}</button>
  <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={onCancel} type="button">Hủy</button>
</div>;
const DataTable = ({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | ReactNode>> }) => <div className="overflow-x-auto rounded-xl bg-white shadow-sm"><table className="min-w-full divide-y divide-slate-200 text-left text-sm">
  <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{headers.map((header) => <th className="px-4 py-3" key={header}>{header}</th>)}</tr></thead>
  <tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td className="max-w-xl px-4 py-3 text-slate-700" key={cellIndex}>{cell}</td>)}</tr>) : <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={headers.length}>Chưa có dữ liệu</td></tr>}</tbody>
</table></div>;

export default RecruitmentAdminPage;
