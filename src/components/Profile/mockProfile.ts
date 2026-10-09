export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  displayTitle: string;
  departmentName: string;
  roles: string[];
  avatarUrl?: string;
}

export const mockUserProfile: UserProfile = {
  id: "usr-001",
  email: "nguyen.van.an@smartrecruitment.vn",
  fullName: "Nguyễn Văn An",
  phone: "0912345678",
  displayTitle: "Chuyên viên Tuyển dụng cấp cao",
  departmentName: "Phòng Tuyển dụng & Thu hút nhân tài (HR)",
  roles: ["RECRUITER", "INTERVIEWER"],
};
