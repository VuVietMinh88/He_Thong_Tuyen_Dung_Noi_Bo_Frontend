import axiosClient from '../utils/axiosClient';

export interface CareerPageBenefit {
  id?: number;
  icon?: string;
  title: string;
  description?: string;
}

export interface CareerPageConfig {
  title: string;
  slogan: string;
  aboutUs: string;
  coverImageUrl: string;
  benefits: CareerPageBenefit[];
}

export const careerPageService = {
  getCareerPage: async (): Promise<CareerPageConfig> => {
    const response = await axiosClient.get<CareerPageConfig>('/career-page');
    return response.data;
  },

  updateCareerPage: async (data: CareerPageConfig): Promise<CareerPageConfig> => {
    const response = await axiosClient.put<CareerPageConfig>('/career-page', data);
    return response.data;
  },
};
