import React, { useState } from 'react';

// === Types ===
export interface Department {
  id: string;
  name: string;
  manager: string;
  hasOpenRequests?: boolean;
  status: 'active' | 'inactive';
  children?: Department[];
}

interface DepartmentTreeViewProps {
  data: Department[];
  onAddChild: (parentId: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDeactivate: (id: string) => void;
}

// === Sub-component: TreeNode ===
// Component đệ quy để render từng node phòng ban và các node con của nó
const TreeNode: React.FC<{
  node: Department;
  level: number;
  onAddChild: (parentId: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDeactivate: (id: string) => void;
}> = ({ node, level, onAddChild, onEdit, onDelete, onDeactivate }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = () => setIsExpanded(!isExpanded);

  return (
    <div className="w-full">
      {/* Node Content */}
      <div 
        className={`flex items-center justify-between py-3 px-4 mb-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
          node.status === 'inactive' ? 'opacity-60 bg-gray-50' : 'border-gray-200'
        }`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Button */}
          <button
            onClick={handleToggle}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 ${
              !hasChildren ? 'invisible' : ''
            }`}
          >
            {isExpanded ? (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            ) : (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            )}
          </button>

          {/* Department Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">{node.name}</h3>
              {node.status === 'inactive' && (
                <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                  Ngừng áp dụng
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Phụ trách: <span className="font-medium text-gray-700">{node.manager || 'Chưa cập nhật'}</span></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddChild(node.id)}
            title="Thêm phòng ban con"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </button>
          
          <button
            onClick={() => onEdit(node.id)}
            title="Chỉnh sửa"
            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>

          {/* Xử lý logic xóa/ngừng áp dụng dựa vào hasOpenRequests */}
          {node.hasOpenRequests ? (
             <button
              onClick={() => onDeactivate(node.id)}
              title="Phòng ban đang có tuyển dụng, chỉ có thể Ngừng áp dụng"
              className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
           </button>
          ) : (
            <button
              onClick={() => onDelete(node.id)}
              title="Xóa phòng ban"
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          )}
        </div>
      </div>

      {/* Children Rendering (Recursive) */}
      {isExpanded && hasChildren && (
        <div className="flex flex-col relative before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-[11px] before:w-px before:bg-gray-200">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// === Main Component ===
const DepartmentTreeView: React.FC<DepartmentTreeViewProps> = ({ 
  data, 
  onAddChild, 
  onEdit, 
  onDelete, 
  onDeactivate 
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Danh mục Tổ chức</h2>
          <p className="text-sm text-gray-500">Quản lý cấu trúc phòng ban và sơ đồ tổ chức</p>
        </div>
        <button 
          onClick={() => onAddChild('root')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Thêm Khối/Phòng ban
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {data.length > 0 ? (
          data.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onDeactivate={onDeactivate}
            />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            Chưa có dữ liệu phòng ban. Vui lòng thêm mới.
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentTreeView;

