export interface IActivityData {
  course_id: number;
  id: number;
  type: string;
  title: string;
  type: 'online_video' | 'interaction';

  data: {
    ai_generate_contents: boolean;
    allow_download: boolean;
    allow_forward_seeking: boolean;
    pause_when_leaving_window: boolean;
  };
}
