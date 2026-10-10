import React, { useState } from 'react';
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';

// --- TYPE DEFINITIONS ---
export interface MasterDataItem {
  id: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
  isReferenced: boolean; // Nếu true => Không được xóa, chỉ được khóa (Inactive)
}

type TabType = 'CANDIDATE_SOURCE' | 'REJECTION_REASON' | 'JOB_LOCATION' | 'JOB_TYPE';

const TABS: { id: TabType; label: string }[] = [
  { id: 'CANDIDATE_SOURCE', label: 'Nguồn ứng viên' },
  { id: 'REJECTION_REASON', label: 'Lý do loại hồ sơ' },
  { id: 'JOB_LOCATION', label: 'Địa điểm làm việc' },
  { id: 'JOB_TYPE', label: 'Hình thức làm việc' },
];

// --- DUMMY DATA ---
const INITIAL_DATA: Record<TabType, MasterDataItem[]> = {
  CANDIDATE_SOURCE: [
    { id: '1', name: 'Facebook', description: 'Nguồn từ mạng xã hội Facebook', order: 1, isActive: true, isReferenced: true },
    { id: '2', name: 'LinkedIn', description: 'Mạng xã hội việc làm', order: 2, isActive: true, isReferenced: true },
    { id: '3', name: 'Tự tìm kiếm', description: 'Headhunt', order: 3, isActive: true, isReferenced: false },
  ],
  REJECTION_REASON: [
    { id: '4', name: 'Không đạt chuyên môn', description: 'Kỹ năng yếu', order: 1, isActive: true, isReferenced: true },
    { id: '5', name: 'Kinh nghiệm chưa phù hợp', description: 'Thiếu số năm kinh nghiệm', order: 2, isActive: true, isReferenced: false },
  ],
  JOB_LOCATION: [
    { id: '6', name: 'Hà Nội', description: 'Trụ sở chính', order: 1, isActive: true, isReferenced: true },
    { id: '7', name: 'TP.HCM', description: 'Chi nhánh miền Nam', order: 2, isActive: true, isReferenced: true },
    { id: '8', name: 'Remote', description: 'Làm việc từ xa', order: 3, isActive: true, isReferenced: false },
  ],
  JOB_TYPE: [
    { id: '9', name: 'Full-time', description: 'Toàn thời gian', order: 1, isActive: true, isReferenced: true },
    { id: '10', name: 'Part-time', description: 'Bán thời gian', order: 2, isActive: true, isReferenced: false },
  ]
};

// --- GENERIC TABLE COMPONENT ---
interface ReusableTableProps {
  data: MasterDataItem[];
  onEdit: (item: MasterDataItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const ReusableTable: React.FC<ReusableTableProps> = ({ data, onEdit, onDelete, onToggleStatus, onMoveUp, onMoveDown }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên giá trị</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thứ tự</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu</td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span>{item.order}</span>
                    <div className="flex flex-col ml-2">
                      <button disabled={index === 0} onClick={() => onMoveUp(index)} className="text-gray-400 hover:text-blue-600 disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button disabled={index === data.length - 1} onClick={() => onMoveDown(index)} className="text-gray-400 hover:text-blue-600 disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onToggleStatus(item.id)}
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center space-x-3">
                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900" title="Sửa">
                      <Pencil size={18} />
                    </button>
                    
                    {item.isReferenced ? (
                      <div className="relative group flex items-center">
                        <button disabled className="text-gray-300 cursor-not-allowed">
                          <Trash2 size={18} />
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                          Dữ liệu đang được sử dụng, không thể xóa. Bạn chỉ có thể đổi trạng thái.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};


// --- MAIN MANAGEMENT COMPONENT ---
export default function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('CANDIDATE_SOURCE');
  const [data, setData] = useState<Record<TabType, MasterDataItem[]>>(INITIAL_DATA);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', order: 1 });

  // Handle Tab Switch
  const currentData = [...data[activeTab]].sort((a, b) => a.order - b.order);

  // Form Handlers
  const handleOpenModal = (item?: MasterDataItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, description: item.description, order: item.order });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '', order: currentData.length + 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setData(prev => {
      const tabData = [...prev[activeTab]];
      if (editingItem) {
        // Edit
        const index = tabData.findIndex(x => x.id === editingItem.id);
        if (index > -1) {
          tabData[index] = { ...tabData[index], ...formData };
        }
      } else {
        // Add
        const newItem: MasterDataItem = {
          id: Date.now().toString(),
          ...formData,
          isActive: true,
          isReferenced: false
        };
        tabData.push(newItem);
      }
      return { ...prev, [activeTab]: tabData };
    });
    handleCloseModal();
  };

  // Action Handlers
  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => item.id !== id)
      }));
    }
  };

  const handleToggleStatus = (id: string) => {
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item => 
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    }));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setData(prev => {
      const tabData = [...prev[activeTab]];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Clone the items to avoid mutating state directly
      const currentItem = { ...tabData[index] };
      const targetItem = { ...tabData[targetIndex] };

      // Swap order values
      const tempOrder = currentItem.order;
      currentItem.order = targetItem.order;
      targetItem.order = tempOrder;
      
      // Put them back in the array
      tabData[index] = currentItem;
      tabData[targetIndex] = targetItem;

      return { ...prev, [activeTab]: tabData };
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục dùng chung</h1>
          <p className="text-gray-500 text-sm mt-1">Thiết lập các danh mục cốt lõi cho hệ thống tuyển dụng</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <ReusableTable 
          data={currentData}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onMoveUp={(idx) => handleMove(idx, 'up')}
          onMoveDown={(idx) => handleMove(idx, 'down')}
        />
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleCloseModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            {/* Modal Panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingItem ? 'Cập nhật danh mục' : 'Thêm mới danh mục'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên giá trị <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.order}
                        onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Lưu lại
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

