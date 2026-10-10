import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  businessService,
  type CompetencyFramework,
  type Department,
  type EvaluationCriteria,
  type Position,
  type Requisition,
} from '../../services/business.service';
import { usePermission } from '../../hooks/usePermission';
import { RequisitionList } from '../../components/Recruitment/RequisitionList';

type Tab = 'requisitions' | 'positions';
const RecruitmentPage = ({ initialTab = 'requisitions' }: { initialTab?: Tab }) => {
  const { can, permissions } = usePermission();
  const canReadOrganization = permissions.includes('ORGANIZATION_READ_ALL');
  const canReadRequisition = permissions.includes('REQUISITIONS_READ_ALL')
    || permissions.includes('REQUISITIONS_READ_SCOPED');
  const [tab, setTab] = useState<Tab>(initialTab);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [frameworks, setFrameworks] = useState<Array<Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'status'>>>([]);
  const [evaluation, setEvaluation] = useState<EvaluationCriteria | null>(null);
  const [error, setError] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Requisition | null>(null);
  const [positionEditing, setPositionEditing] = useState<Position | null>(null);
  const [form, setForm] = useState<RequisitionForm>(emptyRequisitionForm);
  const [positionForm, setPositionForm] = useState<PositionForm>(emptyPositionForm);

  const fetchData = useCallback(async () => {
    const requisitionItems = canReadRequisition
      ? (await businessService.getRequisitions()).items
      : [];
    let positionItems: Position[] = [];
    let departmentItems: Department[] = [];
    let frameworkItems: Array<Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'status'>> = [];
    let referenceMessage = '';
    if (canReadOrganization) {
      const [positionResult, departmentResult, frameworkResult] = await Promise.allSettled([
        businessService.getPositions(),
        businessService.getDepartments(),
        businessService.getFrameworks(),
      ]);
      if (positionResult.status === 'fulfilled') positionItems = positionResult.value.items;
      if (departmentResult.status === 'fulfilled') departmentItems = departmentResult.value.items;
      if (frameworkResult.status === 'fulfilled') frameworkItems = frameworkResult.value.items;
      if (positionResult.status === 'rejected' || departmentResult.status === 'rejected' || frameworkResult.status === 'rejected') {
        referenceMessage = 'Không tải được danh mục chức danh/phòng ban. Vui lòng kiểm tra quyền ORGANIZATION_READ_ALL.';
      }
    } else if (canReadRequisition) {
      referenceMessage = 'Tài khoản không có quyền đọc danh mục chức danh/phòng ban; không thể tạo yêu cầu mới.';
    }
    return { requisitionItems, positionItems, departmentItems, frameworkItems, referenceMessage };
  }, [canReadOrganization, canReadRequisition]);

  useEffect(() => {
    let current = true;
    fetchData()
      .then((data) => {
        if (!current) return;
        setRequisitions(data.requisitionItems);
        setPositions(data.positionItems);
        setDepartments(data.departmentItems);
        setFrameworks(data.frameworkItems);
        setReferenceError(data.referenceMessage);
      })
      .catch((loadError: unknown) => {
        if (current) setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu tuyển dụng.');
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [fetchData]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchData();
      setRequisitions(data.requisitionItems);
      setPositions(data.positionItems);
      setDepartments(data.departmentItems);
      setFrameworks(data.frameworkItems);
      setReferenceError(data.referenceMessage);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu tuyển dụng.');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setPositionEditing(null);
    setForm(emptyRequisitionForm);
    setShowForm(true);
  };

  const openClone = (item: Requisition) => {
    setEditing(null);
    setPositionEditing(null);
    setForm({
      positionId: item.positionId,
      departmentId: item.departmentId,
      headcount: String(item.headcount),
      reasonCode: item.reason,
      proposedSalaryMin: item.proposedSalaryMin === null ? '' : String(item.proposedSalaryMin),
      proposedSalaryMax: item.proposedSalaryMax === null ? '' : String(item.proposedSalaryMax),
      salaryJustification: item.salaryJustification ?? '',
      neededBy: '', // Ngày cần người bị bỏ trống đối với bản sao
      jobDescription: item.jobDescription ?? '',
      candidateRequirements: item.candidateRequirements ?? '',
    });
    setShowForm(true);
  };

  const openEdit = (item: Requisition) => {
    setEditing(item);
    setForm({
      positionId: item.positionId,
      departmentId: item.departmentId,
      headcount: String(item.headcount),
      reasonCode: item.reason,
      proposedSalaryMin: item.proposedSalaryMin === null ? '' : String(item.proposedSalaryMin),
      proposedSalaryMax: item.proposedSalaryMax === null ? '' : String(item.proposedSalaryMax),
      salaryJustification: item.salaryJustification ?? '',
      neededBy: item.neededBy ?? '',
      jobDescription: item.jobDescription ?? '',
      candidateRequirements: item.candidateRequirements ?? '',
    });
    setShowForm(true);
  };

  const submitRequisition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await businessService.saveRequisition(editing?.id ?? null, {
        positionId: form.positionId,
        departmentId: form.departmentId,
        headcount: Number(form.headcount),
        reason: form.reasonCode,
        proposedSalaryMin: form.proposedSalaryMin ? Number(form.proposedSalaryMin) : null,
        proposedSalaryMax: form.proposedSalaryMax ? Number(form.proposedSalaryMax) : null,
        salaryJustification: form.salaryJustification.trim() || null,
        neededBy: form.neededBy || null,
        jobDescription: form.jobDescription.trim() || null,
        candidateRequirements: form.candidateRequirements.trim() || null,
      });
      setShowForm(false);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu yêu cầu tuyển dụng.');
    } finally {
      setSaving(false);
    }
  };

  const submitPosition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await businessService.savePosition(positionEditing?.id ?? null, {
        code: positionForm.code.trim(),
        name: positionForm.name.trim(),
        level: positionForm.level.trim(),
        salaryMin: Number(positionForm.salaryMin),
        salaryMax: Number(positionForm.salaryMax),
        active: positionForm.active,
      });
      setShowForm(false);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu chức danh.');
    } finally {
      setSaving(false);
    }
  };

  const startPositionEdit = (item?: Position) => {
    setEditing(null);
    setPositionEditing(item ?? null);
    setPositionForm(item ? {
      code: item.code,
      name: item.name,
      level: item.level,
      salaryMin: String(item.salaryMin ?? ''),
      salaryMax: String(item.salaryMax ?? ''),
      active: item.active,
    } : emptyPositionForm);
    setShowForm(true);
  };

  const changePositionFramework = async (positionId: string, frameworkId: string) => {
    setSaving(true);
    setError('');
    try {
      if (frameworkId) await businessService.assignPositionFramework(positionId, frameworkId);
      else await businessService.removePositionFramework(positionId);
      await loadData();
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Không thể thay đổi khung năng lực.');
    } finally {
      setSaving(false);
    }
  };

  const showEvaluationCriteria = async (positionId: string) => {
    setError('');
    try {
      setEvaluation(await businessService.getEvaluationCriteria(positionId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải tiêu chí đánh giá.');
    }
  };

  const canWriteRequisition = can('create', 'recruitment') || can('edit', 'recruitment');
  const canWritePosition = permissions.includes('ORGANIZATION_WRITE_ALL')
    && permissions.includes('SALARY_RANGES_WRITE_ALL');
  const canReadSalary = permissions.includes('SALARY_RANGES_READ_ALL');

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tuyển dụng &amp; chức danh</h1>
          <p className="mt-1 text-sm text-slate-500">Dữ liệu và thao tác được kết nối trực tiếp với API Backend.</p>
        </div>
        {!showForm && ((tab === 'requisitions' && canWriteRequisition) || (tab === 'positions' && canWritePosition)) && (
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => tab === 'requisitions' ? openCreate() : startPositionEdit()}
            type="button"
          >
            {tab === 'requisitions' ? 'Tạo yêu cầu' : 'Thêm chức danh'}
          </button>
        )}
      </header>
      {error && <ErrorBanner error={error} onRetry={() => { setLoading(true); setError(''); loadData(); }} />}
      <div className="flex gap-2 border-b border-slate-200">
        {canReadRequisition && <TabButton active={tab === 'requisitions'} onClick={() => { setTab('requisitions'); setShowForm(false); }}>Yêu cầu tuyển dụng</TabButton>}
        {canReadOrganization && <TabButton active={tab === 'positions'} onClick={() => { setTab('positions'); setShowForm(false); }}>Chức danh</TabButton>}
      </div>
      {referenceError && tab === 'requisitions' && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">{referenceError}</p>}
      {evaluation && <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="font-semibold text-indigo-950">Tiêu chí đánh giá: {evaluation.position.name}</h2><p className="text-sm text-indigo-800">{evaluation.framework.name} ({evaluation.framework.code})</p></div>
          <button className="text-sm text-indigo-800 underline" onClick={() => setEvaluation(null)} type="button">Đóng</button>
        </div>
        <ul className="mt-3 divide-y divide-indigo-200">{evaluation.criteria.map((criterion) => <li className="flex justify-between gap-4 py-2 text-sm" key={criterion.id}><span>{criterion.name}{criterion.description ? ` — ${criterion.description}` : ''}</span><strong>{criterion.weight}%</strong></li>)}</ul>
      </section>}

      {showForm && tab === 'requisitions' && departments.length > 0 && positions.length > 0 && (
        <form className="grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={submitRequisition}>
          <h2 className="text-lg font-semibold md:col-span-2">{editing ? 'Sửa yêu cầu nháp' : 'Tạo yêu cầu tuyển dụng (DRAFT)'}</h2>
          <label className="field">Chức danh
            <select required value={form.positionId} onChange={(event) => setForm({ ...form, positionId: event.target.value })}>
              <option value="">Chọn chức danh</option>
              {positions.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
            </select>
          </label>
          <label className="field">Phòng ban
            <select required value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
              <option value="">Chọn phòng ban</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="field">Số lượng
            <input min="1" required type="number" value={form.headcount} onChange={(event) => setForm({ ...form, headcount: event.target.value })} />
          </label>
          <label className="field">Lý do tuyển
            <select value={form.reasonCode} onChange={(event) => setForm({ ...form, reasonCode: event.target.value as RequisitionForm['reasonCode'] })}>
              <option value="NEW_HEADCOUNT">Tăng định biên</option><option value="REPLACEMENT">Thay thế</option>
            </select>
          </label>
          <label className="field">Lương đề xuất tối thiểu (VND)
            <input min="0" type="number" value={form.proposedSalaryMin} onChange={(event) => setForm({ ...form, proposedSalaryMin: event.target.value })} />
          </label>
          <label className="field">Lương đề xuất tối đa (VND)
            <input min="0" type="number" value={form.proposedSalaryMax} onChange={(event) => setForm({ ...form, proposedSalaryMax: event.target.value })} />
          </label>
          <label className="field">Ngày cần nhân sự
            <input type="date" value={form.neededBy} onChange={(event) => setForm({ ...form, neededBy: event.target.value })} />
          </label>
          <label className="field md:col-span-2">Giải trình lương (nếu ngoài dải chuẩn)
            <textarea rows={2} value={form.salaryJustification} onChange={(event) => setForm({ ...form, salaryJustification: event.target.value })} />
          </label>
          <label className="field md:col-span-2">Mô tả công việc
            <textarea rows={3} value={form.jobDescription} onChange={(event) => setForm({ ...form, jobDescription: event.target.value })} />
          </label>
          <label className="field md:col-span-2">Yêu cầu ứng viên
            <textarea rows={3} value={form.candidateRequirements} onChange={(event) => setForm({ ...form, candidateRequirements: event.target.value })} />
          </label>
          <FormActions saving={saving} onCancel={() => setShowForm(false)} />
        </form>
      )}

      {showForm && tab === 'positions' && (
        <form className="grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2" onSubmit={submitPosition}>
          <h2 className="text-lg font-semibold md:col-span-2">{positionEditing ? 'Sửa chức danh' : 'Thêm chức danh'}</h2>
          <label className="field">Mã chức danh<input required maxLength={50} value={positionForm.code} onChange={(event) => setPositionForm({ ...positionForm, code: event.target.value })} /></label>
          <label className="field">Tên chức danh<input required maxLength={150} value={positionForm.name} onChange={(event) => setPositionForm({ ...positionForm, name: event.target.value })} /></label>
          <label className="field">Cấp bậc<input required maxLength={80} value={positionForm.level} onChange={(event) => setPositionForm({ ...positionForm, level: event.target.value })} /></label>
          <label className="field">Lương tối thiểu (VND)<input required min="0" type="number" value={positionForm.salaryMin} onChange={(event) => setPositionForm({ ...positionForm, salaryMin: event.target.value })} /></label>
          <label className="field">Lương tối đa (VND)<input required min="0" type="number" value={positionForm.salaryMax} onChange={(event) => setPositionForm({ ...positionForm, salaryMax: event.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm"><input checked={positionForm.active} type="checkbox" onChange={(event) => setPositionForm({ ...positionForm, active: event.target.checked })} /> Đang hoạt động</label>
          <FormActions saving={saving} onCancel={() => setShowForm(false)} />
        </form>
      )}

      {loading ? <div className="rounded-xl bg-white p-6 text-slate-600" role="status">Đang tải dữ liệu…</div> : (
        tab === 'requisitions'
          ? <RequisitionList positions={positions} departments={departments} editable={canWriteRequisition} onEdit={openEdit} onClone={openClone} />
          : <PositionTable
            items={positions}
            frameworks={frameworks}
            canReadSalary={canReadSalary}
            editable={canWritePosition}
            canManageFramework={permissions.includes('ORGANIZATION_WRITE_ALL')}
            saving={saving}
            onEdit={startPositionEdit}
            onFrameworkChange={(positionId, frameworkId) => void changePositionFramework(positionId, frameworkId)}
            onViewEvaluation={(positionId) => void showEvaluationCriteria(positionId)}
          />
      )}
    </section>
  );
};

type RequisitionForm = {
  positionId: string; departmentId: string; headcount: string; reasonCode: 'REPLACEMENT' | 'NEW_HEADCOUNT';
  proposedSalaryMin: string; proposedSalaryMax: string; salaryJustification: string; neededBy: string;
  jobDescription: string; candidateRequirements: string;
};
const emptyRequisitionForm: RequisitionForm = {
  positionId: '', departmentId: '', headcount: '1', reasonCode: 'NEW_HEADCOUNT',
  proposedSalaryMin: '', proposedSalaryMax: '', salaryJustification: '', neededBy: '',
  jobDescription: '', candidateRequirements: '',
};
type PositionForm = { code: string; name: string; level: string; salaryMin: string; salaryMax: string; active: boolean };
const emptyPositionForm: PositionForm = { code: '', name: '', level: '', salaryMin: '', salaryMax: '', active: true };

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) => (
  <button className={`border-b-2 px-4 py-2 text-sm font-medium ${active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`} onClick={onClick} type="button">{children}</button>
);
const FormActions = ({ saving, onCancel }: { saving: boolean; onCancel: () => void }) => (
  <div className="flex gap-2 md:col-span-2">
    <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu'}</button>
    <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={onCancel} type="button">Hủy</button>
  </div>
);
const ErrorBanner = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error} <button className="ml-2 underline" onClick={onRetry} type="button">Tải lại</button></div>
);
const Table = ({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | ReactNode>> }) => (
  <div className="overflow-x-auto rounded-xl bg-white shadow-sm"><table className="min-w-full divide-y divide-slate-200 text-left text-sm">
    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{headers.map((header) => <th className="px-4 py-3" key={header}>{header}</th>)}</tr></thead>
    <tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td className="px-4 py-3 text-slate-700" key={cellIndex}>{cell}</td>)}</tr>) : <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={headers.length}>Chưa có dữ liệu</td></tr>}</tbody>
  </table></div>
);

const PositionTable = ({ items, frameworks, canReadSalary, editable, canManageFramework, saving, onEdit, onFrameworkChange, onViewEvaluation }: {
  items: Position[];
  frameworks: Array<Pick<CompetencyFramework, 'id' | 'code' | 'name' | 'status'>>;
  canReadSalary: boolean;
  editable: boolean;
  canManageFramework: boolean;
  saving: boolean;
  onEdit: (item?: Position) => void;
  onFrameworkChange: (positionId: string, frameworkId: string) => void;
  onViewEvaluation: (positionId: string) => void;
}) => (
  <Table headers={['Mã', 'Chức danh', 'Cấp bậc', ...(canReadSalary ? ['Dải lương (VND)'] : []), 'Trạng thái', 'Khung năng lực', 'Tiêu chí', ...(editable ? ['Thao tác'] : [])]} rows={items.map((item) => [
    item.code, item.name, item.level,
    ...(canReadSalary ? [`${item.salaryMin?.toLocaleString('vi-VN') ?? '—'} - ${item.salaryMax?.toLocaleString('vi-VN') ?? '—'}`] : []),
    item.active ? 'Hoạt động' : 'Ngừng',
    canManageFramework
      ? <select key={`framework-${item.id}`} aria-label={`Khung năng lực cho ${item.name}`} className="max-w-56 rounded border border-slate-300 px-2 py-1" disabled={saving} value={item.competencyFrameworkId ?? ''} onChange={(event) => onFrameworkChange(item.id, event.target.value)}>
        <option value="">Chưa gán khung</option>
        {frameworks.filter((framework) => framework.status === 'ACTIVE' || framework.id === item.competencyFrameworkId).map((framework) => <option key={framework.id} value={framework.id}>{framework.name}</option>)}
      </select>
      : frameworks.find((framework) => framework.id === item.competencyFrameworkId)?.name ?? 'Chưa gán',
    item.competencyFrameworkId
      ? <button key={`criteria-${item.id}`} className="font-medium text-indigo-700 underline" onClick={() => onViewEvaluation(item.id)} type="button">Xem tiêu chí</button>
      : '—',
    ...(editable ? [<button className="font-medium text-indigo-700 underline" key={item.id} onClick={() => onEdit(item)} type="button">Sửa</button>] : []),
  ])} />
);

export default RecruitmentPage;
