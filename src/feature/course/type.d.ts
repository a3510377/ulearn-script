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

export type RoleType =
  | 'student' // 學生
  | 'instructor' // 責任老師
  | 'student_assistant' // 學生助教
  | 'assistant_instructor' // 輔導老師
  | 'instructor_assistant' // 助教
  | 'team_teaching' // 協同備課
  | 'chief_instructor' // 主持老師
  | 'student_manager' // 班主任
  | 'external_lecturer' // 業師
  | 'lecturer' // 主講教師
  | 'training_admin' // 培訓管理員
  | 'training_assistant' // 培訓助教
  | 'customer'; // 自訂

//  'web_link': '線上連結',
//  'material': '參考檔案',
//  'homework': '作業',
//  'forum': '討論',
//  'online_video': '影音教材',
//  'slide': '微課程',
//  'lesson': '錄影教材',
//  'exam': '線上測驗',
//  'chatroom': 'iSlide 直播',
//  'classroom': '隨堂測驗',
//  'questionnaire': '問卷調查',
//  'page': '頁面',
//  'scorm': '第三方教材',
//  'interaction': '互動教材',
//  'feedback': '教學回饋',
//  'virtual_classroom': 'Connect 直播',
//  'zoom': 'Zoom直播',
//  'welink': 'Welink',
//  'tencent_meeting': '騰訊會議',
//  'classin': 'ClassIn 直播',
//  'live_record': '直播',
//  'select_student': '選人',
//  'race_answer': '搶答',
//  'number_rollcall': '数字点名',
//  'qr_rollcall': '二维码点名',
//  'virtual_experiment': '模擬實驗',
