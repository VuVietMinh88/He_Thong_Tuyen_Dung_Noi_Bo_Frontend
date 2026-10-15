import axiosClient from '../utils/axiosClient';
import type {
  DepartmentChecklistTemplate,
} from '../types/onboardingChecklist';

const STORAGE_KEY = 'smart_recruitment_onboarding_templates_v1';

export const DEFAULT_DEPARTMENT_TEMPLATES: DepartmentChecklistTemplate[] = [
  {
    departmentId: 'dept-it',
    departmentName: 'Khối Công nghệ thông tin & Sản phẩm (IT)',
    departmentCode: 'TECH',
    description: 'Quy trình tiếp nhận kỹ sư phần mềm, kiến trúc sư hệ thống, QA và chuyên gia công nghệ',
    lastUpdated: '2026-10-15T09:00:00Z',
    updatedBy: 'Lê Thu Hương (HR Lead)',
    items: [
      {
        id: 'it-item-1',
        title: 'Cấp phát máy tính xách tay và phụ kiện kỹ thuật cấu hình cao',
        description: 'Bàn giao MacBook Pro / Dell XPS, màn hình 27-inch, bàn phím và chuột theo tiêu chuẩn kỹ sư',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 1,
        category: 'Thiết bị & Công cụ',
      },
      {
        id: 'it-item-2',
        title: 'Khởi tạo tài khoản Git, Jira, Slack, AWS/GCP & cấu hình VPN',
        description: 'Tạo tài khoản Google Workspace, cấp quyền repo GitLab/GitHub và cấu hình VPN truy cập server nội bộ',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 2,
        category: 'Tài khoản & Phân quyền',
      },
      {
        id: 'it-item-3',
        title: 'Ký kết hợp đồng lao động và cam kết bảo mật thông tin (NDA)',
        description: 'Ký HĐLĐ thử việc, phụ lục trang thiết bị và thỏa thuận quyền sở hữu trí tuệ công nghệ',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 3,
        category: 'Hồ sơ pháp lý',
      },
      {
        id: 'it-item-4',
        title: 'Hướng dẫn cài đặt môi trường lập trình local & Docker container',
        description: 'Clone repo template, cấu hình Docker Compose, migrate database mẫu và chạy thành công unit test',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 4,
        category: 'Kỹ thuật chuyên môn',
      },
      {
        id: 'it-item-5',
        title: 'Giới thiệu Buddy hỗ trợ kỹ thuật và văn hóa giao tiếp trong Squad',
        description: 'Phân công 1 Senior Developer đồng hành kèm cặp kỹ thuật trong 2 tháng thử việc',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 1,
        isRequired: false,
        isActive: true,
        order: 5,
        category: 'Hội nhập đội ngũ',
      },
      {
        id: 'it-item-6',
        title: 'Hoàn thành khóa đào tạo quy chuẩn bảo mật an toàn thông tin (ISMS)',
        description: 'Học trực tuyến trên cổng E-learning, làm bài trắc nghiệm và đạt điểm số >= 80%',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        dueDays: 5,
        isRequired: true,
        isActive: true,
        order: 6,
        category: 'Đào tạo nội bộ',
      },
      {
        id: 'it-item-7',
        title: 'Thực hiện task Jira kỹ thuật đầu tay và tạo Pull Request đầu tiên',
        description: 'Nhận 1 bugfix nhỏ hoặc feature phụ, tuân thủ git flow và được team lead duyệt code review',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        dueDays: 7,
        isRequired: true,
        isActive: true,
        order: 7,
        category: 'Kỹ thuật chuyên môn',
      },
      {
        id: 'it-item-8',
        title: 'Đánh giá tiến độ thử việc tháng 1 và buổi phản hồi 1-1 với Tech Lead',
        description: 'Đối chiếu mục tiêu 30 ngày đầu, chia sẻ khó khăn và định hướng mục tiêu kỹ thuật tháng thứ 2',
        phase: 'FIRST_MONTH',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 30,
        isRequired: true,
        isActive: true,
        order: 8,
        category: 'Đánh giá hiệu suất',
      },
    ],
  },
  {
    departmentId: 'dept-marketing',
    departmentName: 'Khối Marketing & Truyền thông',
    departmentCode: 'MKT',
    description: 'Quy trình tiếp nhận chuyên viên Digital Marketing, Content Creator, Thiết kế và Brand Specialist',
    lastUpdated: '2026-10-14T14:30:00Z',
    updatedBy: 'Trần Văn Hoàng (Marketing Director)',
    items: [
      {
        id: 'mkt-item-1',
        title: 'Bàn giao máy tính xách tay và thiết lập email tiếp thị số',
        description: 'Cấp laptop văn phòng có tích hợp sẵn các font chữ thương hiệu và bộ phần mềm văn phòng',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 1,
        category: 'Thiết bị & Công cụ',
      },
      {
        id: 'mkt-item-2',
        title: 'Phân quyền tài khoản Meta Ads, Google Analytics, Canva Pro & Figma',
        description: 'Thêm email vào Business Manager và cấp quyền Viewer/Editor theo vị trí đảm nhiệm',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 2,
        category: 'Tài khoản & Phân quyền',
      },
      {
        id: 'mkt-item-3',
        title: 'Ký hợp đồng lao động và hoàn tất hồ sơ nhân sự',
        description: 'Nộp ảnh hồ sơ, sổ BHXH và ký HĐLĐ thử việc tại văn phòng công ty',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 3,
        category: 'Hồ sơ pháp lý',
      },
      {
        id: 'mkt-item-4',
        title: 'Tìm hiểu Brand Guidelines và Bộ nhận diện thương hiệu công ty',
        description: 'Nghiên cứu cẩm nang thương hiệu, tone & voice, màu sắc chủ đạo và đối tượng khách hàng mục tiêu',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 2,
        isRequired: true,
        isActive: true,
        order: 4,
        category: 'Đào tạo nội bộ',
      },
      {
        id: 'mkt-item-5',
        title: 'Lập kế hoạch phân bổ nội dung hoặc đề xuất ý tưởng chiến dịch tuần 1',
        description: 'Đề xuất 3 ý tưởng truyền thông hoặc kế hoạch content cho tuần đầu thử việc',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        dueDays: 7,
        isRequired: true,
        isActive: true,
        order: 5,
        category: 'Thực thi chuyên môn',
      },
      {
        id: 'mkt-item-6',
        title: 'Buổi tổng kết đánh giá hiệu quả chiến dịch tháng thứ nhất',
        description: 'Báo cáo chỉ số chuyển đổi, lưu lượng truy cập và đánh giá mức độ tương thích công việc',
        phase: 'FIRST_MONTH',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 30,
        isRequired: true,
        isActive: true,
        order: 6,
        category: 'Đánh giá hiệu suất',
      },
    ],
  },
  {
    departmentId: 'dept-sales',
    departmentName: 'Khối Kinh doanh & Phát triển khách hàng (Sales)',
    departmentCode: 'SALES',
    description: 'Quy trình tiếp nhận Account Executive, Chuyên viên tư vấn doanh nghiệp B2B và Telesales',
    lastUpdated: '2026-10-13T16:00:00Z',
    updatedBy: 'Nguyễn Tiến Dũng (Sales Director)',
    items: [
      {
        id: 'sales-item-1',
        title: 'Cấp tài khoản CRM, hệ thống VoIP tổng đài và danh bạ hotline',
        description: 'Khởi tạo tài khoản phần mềm quản lý quan hệ khách hàng và cấp tai nghe tổng đài',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 1,
        category: 'Tài khoản & Phân quyền',
      },
      {
        id: 'sales-item-2',
        title: 'Ký kết HĐLĐ và thỏa thuận mục tiêu doanh số KPI thử việc',
        description: 'Ký hợp đồng và thống nhất chính sách hoa hồng, phụ cấp công tác và thưởng doanh số',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 2,
        category: 'Hồ sơ pháp lý',
      },
      {
        id: 'sales-item-3',
        title: 'Đào tạo sản phẩm chuyên sâu, bảng giá dịch vụ và chính sách ưu đãi',
        description: 'Học danh mục sản phẩm chủ lực, điểm khác biệt cạnh tranh và quy trình lên báo giá hợp đồng',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 2,
        isRequired: true,
        isActive: true,
        order: 3,
        category: 'Đào tạo nội bộ',
      },
      {
        id: 'sales-item-4',
        title: 'Luyện tập kịch bản tư vấn (Role-play) và xử lý từ chối cùng Quản lý',
        description: 'Mô phỏng 3 tình huống khách hàng khó tính và các bước chốt deal tiêu chuẩn',
        phase: 'FIRST_WEEK',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 5,
        isRequired: true,
        isActive: true,
        order: 4,
        category: 'Thực thi chuyên môn',
      },
      {
        id: 'sales-item-5',
        title: 'Thực hiện 20 cuộc gọi tư vấn mẫu đầu tiên dưới sự giám sát',
        description: 'Liên hệ khách hàng tiềm năng, ghi nhận log tương tác vào CRM và nhận góp ý từ mentor',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        dueDays: 7,
        isRequired: true,
        isActive: true,
        order: 5,
        category: 'Thực thi chuyên môn',
      },
      {
        id: 'sales-item-6',
        title: 'Đánh giá tỷ lệ chuyển đổi tháng đầu và định hướng mục tiêu tháng tiếp theo',
        description: 'Kiểm tra tỷ lệ hoàn thành KPI, danh sách khách hàng đang nuôi dưỡng và kế hoạch chốt hợp đồng',
        phase: 'FIRST_MONTH',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 30,
        isRequired: true,
        isActive: true,
        order: 6,
        category: 'Đánh giá hiệu suất',
      },
    ],
  },
  {
    departmentId: 'dept-hr',
    departmentName: 'Phòng Quản trị Nguồn nhân lực (HR)',
    departmentCode: 'HR',
    description: 'Quy trình tiếp nhận Chuyên viên Tuyển dụng, C&B, Đào tạo và Phát triển tổ chức',
    lastUpdated: '2026-10-12T11:00:00Z',
    updatedBy: 'Lê Thu Hương (Head of HR)',
    items: [
      {
        id: 'hr-item-1',
        title: 'Chuẩn bị góc làm việc, máy tính văn phòng và thẻ nhân viên',
        description: 'Bố trí chỗ ngồi tại phòng nhân sự, in thẻ nhân viên có chip ra vào cổng',
        phase: 'PRE_BOARDING',
        responsibleRole: 'HR',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 1,
        category: 'Hậu cần tiếp đón',
      },
      {
        id: 'hr-item-2',
        title: 'Tiếp nhận hồ sơ nhân sự gốc và khai báo thủ tục bảo hiểm xã hội',
        description: 'Kiểm tra bằng cấp công chứng, sơ yếu lý lịch, giấy khám sức khỏe và đăng ký mã số BHXH',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 2,
        category: 'Hồ sơ pháp lý',
      },
      {
        id: 'hr-item-3',
        title: 'Phổ biến nội quy lao động, chính sách phúc lợi và sơ đồ phân quyền',
        description: 'Hướng dẫn quy chế chấm công, xin nghỉ phép, đồng phục và văn hóa làm việc tại văn phòng',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 3,
        category: 'Văn hóa & Nội quy',
      },
      {
        id: 'hr-item-4',
        title: 'Làm quen hệ thống Smart Recruitment System và cổng quản lý ứng viên',
        description: 'Thao tác các tính năng phân loại hồ sơ, xếp lịch phỏng vấn và xuất báo cáo tuyển dụng',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        dueDays: 5,
        isRequired: true,
        isActive: true,
        order: 4,
        category: 'Hệ thống phần mềm',
      },
      {
        id: 'hr-item-5',
        title: 'Độc lập sàng lọc hồ sơ và điều phối vòng phỏng vấn đầu tiên',
        description: 'Thực hiện screening 15 CV cho vị trí mở và gửi thư mời phỏng vấn đến ứng viên',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        dueDays: 7,
        isRequired: true,
        isActive: true,
        order: 5,
        category: 'Thực thi chuyên môn',
      },
      {
        id: 'hr-item-6',
        title: 'Đánh giá thử việc tháng 1 và buổi trò chuyện chia sẻ cảm nhận hội nhập',
        description: 'Trao đổi cùng Trưởng phòng Nhân sự về mức độ hòa nhập văn hóa và đóng góp sáng kiến',
        phase: 'FIRST_MONTH',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 30,
        isRequired: true,
        isActive: true,
        order: 6,
        category: 'Đánh giá hiệu suất',
      },
    ],
  },
  {
    departmentId: 'dept-accounting',
    departmentName: 'Phòng Kế toán & Tài chính doanh nghiệp',
    departmentCode: 'ACC',
    description: 'Quy trình tiếp nhận Kế toán tổng hợp, Kế toán thanh toán, Kế toán thuế và Chuyên viên tài chính',
    lastUpdated: '2026-10-11T10:15:00Z',
    updatedBy: 'Vũ Thị Thanh Mai (Chief Accountant)',
    items: [
      {
        id: 'acc-item-1',
        title: 'Cài đặt phần mềm kế toán ERP, cấp chữ ký số & mã phân quyền',
        description: 'Cấu hình phần mềm MISA/SAP/ERP và phân quyền truy cập phân hệ kế toán phù hợp',
        phase: 'PRE_BOARDING',
        responsibleRole: 'IT_SUPPORT',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 1,
        category: 'Hệ thống phần mềm',
      },
      {
        id: 'acc-item-2',
        title: 'Ký kết hợp đồng lao động và bàn giao quy chế tài chính nội bộ',
        description: 'Ký HĐLĐ thử việc và cam kết tuân thủ quy chế chi tiêu, bảo mật số liệu tài chính',
        phase: 'DAY_ONE',
        responsibleRole: 'HR',
        dueDays: 1,
        isRequired: true,
        isActive: true,
        order: 2,
        category: 'Hồ sơ pháp lý',
      },
      {
        id: 'acc-item-3',
        title: 'Hướng dẫn quy trình phê duyệt thanh toán và lưu trữ hóa đơn chứng từ',
        description: 'Nắm vững quy định về hóa đơn điện tử, hợp đồng kinh tế và chữ ký kiểm soát nội bộ',
        phase: 'DAY_ONE',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 2,
        isRequired: true,
        isActive: true,
        order: 3,
        category: 'Nghiệp vụ tài chính',
      },
      {
        id: 'acc-item-4',
        title: 'Kiểm tra đối chiếu số liệu công nợ và sổ sách chứng từ tuần đầu',
        description: 'Thực hiện kiểm tra tính hợp lệ của 20 bộ hồ sơ thanh toán thực tế',
        phase: 'FIRST_WEEK',
        responsibleRole: 'NEW_HIRE',
        dueDays: 7,
        isRequired: true,
        isActive: true,
        order: 4,
        category: 'Thực thi chuyên môn',
      },
      {
        id: 'acc-item-5',
        title: 'Báo cáo quyết toán sơ bộ tháng đầu và đối chiếu ngân sách các phòng',
        description: 'Thực hiện kết chuyển số liệu tháng, lập bảng cân đối số phát sinh và trao đổi 1-1 với Kế toán trưởng',
        phase: 'FIRST_MONTH',
        responsibleRole: 'DIRECT_MANAGER',
        dueDays: 30,
        isRequired: true,
        isActive: true,
        order: 5,
        category: 'Đánh giá hiệu suất',
      },
    ],
  },
];

export const onboardingChecklistService = {
  /**
   * Lấy toàn bộ danh sách mẫu checklist theo phòng ban
   */
  async getDepartmentTemplates(): Promise<DepartmentChecklistTemplate[]> {
    try {
      const response = await axiosClient.get<{ data?: DepartmentChecklistTemplate[] }>(
        '/onboarding/templates'
      );
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // Fallback lấy dữ liệu local storage
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read error
    }

    // Khởi tạo mặc định và lưu vào localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENT_TEMPLATES));
    } catch {
      // Ignore
    }

    return JSON.parse(JSON.stringify(DEFAULT_DEPARTMENT_TEMPLATES));
  },

  /**
   * Lấy mẫu checklist của một phòng ban cụ thể
   */
  async getTemplateByDepartment(departmentId: string): Promise<DepartmentChecklistTemplate> {
    try {
      const response = await axiosClient.get<{ data?: DepartmentChecklistTemplate }>(
        `/onboarding/templates/${encodeURIComponent(departmentId)}`
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const templates = await this.getDepartmentTemplates();
    const found = templates.find((t) => t.departmentId === departmentId);
    if (found) {
      return JSON.parse(JSON.stringify(found));
    }

    // Nếu không tìm thấy, trả về template đầu tiên
    return JSON.parse(JSON.stringify(templates[0] || DEFAULT_DEPARTMENT_TEMPLATES[0]));
  },

  /**
   * Lưu hoặc cập nhật mẫu checklist của một phòng ban (AC 3)
   */
  async saveDepartmentTemplate(
    departmentId: string,
    templateData: DepartmentChecklistTemplate
  ): Promise<DepartmentChecklistTemplate> {
    const updatedTemplate: DepartmentChecklistTemplate = {
      ...templateData,
      lastUpdated: new Date().toISOString(),
      updatedBy: templateData.updatedBy || 'Ban Quản trị Tuyển dụng & Nhân sự',
    };

    try {
      const response = await axiosClient.put<{ data?: DepartmentChecklistTemplate }>(
        `/onboarding/templates/${encodeURIComponent(departmentId)}`,
        updatedTemplate
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback lưu local storage
    }

    const currentTemplates = await this.getDepartmentTemplates();
    const index = currentTemplates.findIndex((t) => t.departmentId === departmentId);

    if (index >= 0) {
      currentTemplates[index] = updatedTemplate;
    } else {
      currentTemplates.push(updatedTemplate);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTemplates));
    } catch {
      // Ignore localStorage write error
    }

    return updatedTemplate;
  },

  /**
   * Khôi phục mẫu checklist của phòng ban về cấu hình chuẩn ban đầu
   */
  async resetDepartmentTemplateToDefault(
    departmentId: string
  ): Promise<DepartmentChecklistTemplate> {
    const defaultOne = DEFAULT_DEPARTMENT_TEMPLATES.find((t) => t.departmentId === departmentId);
    if (!defaultOne) {
      throw new Error(`Không tìm thấy mẫu mặc định cho phòng ban ${departmentId}`);
    }

    return this.saveDepartmentTemplate(departmentId, JSON.parse(JSON.stringify(defaultOne)));
  },
};
