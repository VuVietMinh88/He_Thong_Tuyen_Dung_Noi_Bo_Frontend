import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { InterviewEvaluationForm, type InterviewEvaluationFormProps } from './InterviewEvaluationForm';
import { evaluationApi, evaluationError, fromApiConclusion, isVersionConflict, type EvaluationView } from '../../services/evaluationApi';

export function BackendEvaluationPanel(props: InterviewEvaluationFormProps & { interviewId: string }) {
  const [form, setForm] = useState<EvaluationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [revision, setRevision] = useState(0);
  const [peers, setPeers] = useState<EvaluationView[]>([]);
  const [peerError, setPeerError] = useState('');
  const pending = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError(''); setMissing(false); setPeers([]);
    try {
      const loaded = await evaluationApi.get(props.interviewId);
      if (current !== generation.current) return;
      setForm(loaded); setConflict(false); setRevision(value => value + 1);
    } catch (cause) {
      if (current !== generation.current) return;
      setForm(null);
      if (axios.isAxiosError(cause) && cause.response?.status === 404
          && cause.response.data?.code === 'EVALUATION_NOT_FOUND') setMissing(true);
      else setError(evaluationError(cause));
    } finally { if (current === generation.current) setLoading(false); }
  }, [props.interviewId]);
  useEffect(() => { void load(); return () => { generation.current++; }; }, [load]);
  useEffect(() => {
    setPeers([]); setPeerError('');
    if (form?.status !== 'SUBMITTED') return;
    let active = true;
    evaluationApi.peers(form.interviewId).then(value => { if (active) setPeers(value); })
      .catch(cause => { if (active) setPeerError(evaluationError(cause)); });
    return () => { active = false; };
  }, [form]);
  const create = async () => {
    if (pending.current) return;
    pending.current = true; setLoading(true); setError('');
    try { setForm(await evaluationApi.create(props.interviewId)); setMissing(false); setRevision(value => value + 1); }
    catch (cause) { setError(evaluationError(cause)); setConflict(isVersionConflict(cause)); }
    finally { pending.current = false; setLoading(false); }
  };
  if (loading) return <p role="status">Đang tải phiếu đánh giá từ máy chủ…</p>;
  if (!props.interviewId) return <p role="alert">Thiếu mã lịch phỏng vấn.</p>;
  if (!form) return <div>
    {error && <p role="alert">{error}</p>}
    {missing && <button type="button" onClick={() => void create()}>Tạo phiếu đánh giá</button>}
    <button type="button" onClick={() => void load()}>Tải lại từ máy chủ</button>
  </div>;
  const persist = async (value: Parameters<NonNullable<InterviewEvaluationFormProps['onSaveDraft']>>[0], submit: boolean) => {
    if (pending.current || conflict) throw new Error('Tải lại phiếu trước khi tiếp tục.');
    pending.current = true; setError('');
    try {
      const saved = await evaluationApi.save(form, value.criteriaEvaluations, value.conclusion ?? null, submit);
      setForm(saved); setRevision(v => v + 1);
      if (submit && saved.conclusion && saved.submittedAt) {
        await props.onSubmit?.({ ...value, calculatedTotalScore: saved.totalScore,
          conclusion: fromApiConclusion(saved.conclusion)!, isLocked: true, submittedAt: saved.submittedAt });
      } else if (!submit) await props.onSaveDraft?.({ ...value, calculatedTotalScore: saved.totalScore });
    } catch (cause) { setError(evaluationError(cause)); setConflict(isVersionConflict(cause)); throw cause; }
    finally { pending.current = false; }
  };
  return <div>
    {error && <div role="alert"><p>{error}</p>
      <button type="button" onClick={() => {
        if (window.confirm('Tải lại sẽ thay thế bản chỉnh sửa chưa lưu bằng dữ liệu trên máy chủ. Tiếp tục?')) void load();
      }}>Tải lại dữ liệu</button></div>}
    {peerError && <p role="alert">Không tải được đánh giá hội đồng: {peerError}</p>}
    <InterviewEvaluationForm {...props} key={`${form.id}:${revision}`} isAuthorized
      readOnly={props.readOnly || conflict} isLocked={form.status === 'SUBMITTED'}
      submittedAt={form.firstSubmittedAt} hasSubmittedOwnEvaluation={form.status === 'SUBMITTED'}
      frameworkName={form.framework.name} frameworkCode={form.framework.code} frameworkVersion=""
      generalNotesSupported={false} serverTotalScore={form.totalScore}
      criteria={form.items.map(item => ({ id: item.criterionId, name: item.name, description: item.description,
        weight: item.weight, sortOrder: item.sortOrder }))}
      initialEvaluations={Object.fromEntries(form.items.map(item => [item.criterionId, {
        score: item.score as 1 | 2 | 3 | 4 | 5 | null, comment: item.comment ?? '',
      }]))} initialGeneralNotes="" initialConclusion={fromApiConclusion(form.conclusion)}
      peerEvaluations={peers.map(peer => ({ interviewerId: peer.evaluatorId, interviewerName: peer.evaluatorId,
        isSubmitted: peer.status === 'SUBMITTED', submittedAt: peer.submittedAt ?? undefined,
        calculatedTotalScore: peer.totalScore, conclusion: fromApiConclusion(peer.conclusion),
        criteriaScores: Object.fromEntries(peer.items.map(item => [item.criterionId, item.score])),
      }))}
      onSubmit={value => persist(value, true)} onSaveDraft={value => persist(value, false)}
      onReopen={async reason => {
        try {
          const metadata = await evaluationApi.status(form.interviewId, form.id);
          if (metadata.version !== form.version) {
            setConflict(true);
            throw new Error('Phiếu đã thay đổi. Tải lại dữ liệu trước khi mở lại.');
          }
          await evaluationApi.reopen(form.interviewId, form.id, form.version, reason ?? '');
          await load();
        } catch (cause) { setError(evaluationError(cause)); setConflict(value => value || isVersionConflict(cause)); throw cause; }
      }} />
  </div>;
}
