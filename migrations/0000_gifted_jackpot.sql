CREATE TABLE "assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"Assignmentname" text,
	"category" text,
	"contentid" text,
	"description" text,
	"expiring_date" text,
	"imagelink" text,
	"noofquestion" integer,
	"Question_id" text,
	"status" text,
	"subject" text,
	"testtype" text,
	"tg_tao" text,
	"topicid" text,
	"type" text,
	"typeofquestion" text,
	"update" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assignment_student_try" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignmentid" text,
	"contentID" text,
	"end_time" text,
	"hocsinh_id" text,
	"questionIDs" text,
	"start_time" text,
	"typeoftaking" text,
	"update" text
);
--> statement-breakpoint
CREATE TABLE "cms_filter_config" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"parent_level" integer,
	"filter_type" text NOT NULL,
	"column_name" text,
	"column_value" text,
	"filter_logic" text DEFAULT 'equals',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collection_content" (
	"id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"content_id" text,
	"topic_id" text,
	"groupcard_id" text,
	"display_order" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"page_route" text NOT NULL,
	"display_type" text NOT NULL,
	"filter_criteria" jsonb,
	"sort_order" text DEFAULT 'asc',
	"sort_field" text DEFAULT 'title',
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" text PRIMARY KEY NOT NULL,
	"topicid" text NOT NULL,
	"imageid" text,
	"videoid" text,
	"videoid2" text,
	"challengesubject" text[],
	"parentid" text,
	"prompt" text,
	"information" text,
	"title" text NOT NULL,
	"short_blurb" text,
	"second_short_blurb" text,
	"mindmap" text,
	"mindmapurl" text,
	"translation" text,
	"vocabulary" text,
	"classdone" text,
	"studentseen" text,
	"show" text,
	"showtranslation" text,
	"showstudent" text,
	"order" text,
	"contentgroup" text,
	"typeoftaking" text,
	"short_description" text,
	"url" text,
	"header" text,
	"update" text,
	"imagelink" text,
	"translation_dictionary" jsonb
);
--> statement-breakpoint
CREATE TABLE "content_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"content_id" text NOT NULL,
	"rating" text NOT NULL,
	"personal_note" text,
	"view_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cron_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"activity_date" timestamp NOT NULL,
	"activities_count" integer DEFAULT 0,
	"points_earned" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "debate_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"content_id" text NOT NULL,
	"topic_id" text,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"submission_notes" text,
	"teacher_feedback" text,
	"grade" integer,
	"status" text DEFAULT 'submitted',
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" text PRIMARY KEY NOT NULL,
	"imagelink" text,
	"contentid" text,
	"default" text,
	"description" text,
	"imagefile" text,
	"name" text,
	"questionid" text,
	"showimage" text,
	"topicid" text
);
--> statement-breakpoint
CREATE TABLE "learning_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"topic_id" text,
	"content_id" text,
	"status" text NOT NULL,
	"progress_percentage" integer DEFAULT 0,
	"time_spent" integer DEFAULT 0,
	"score" integer,
	"completed_at" timestamp,
	"last_accessed" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matching" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text,
	"subject" text,
	"topic" text,
	"description" text,
	"prompt1" text,
	"prompt2" text,
	"prompt3" text,
	"prompt4" text,
	"prompt5" text,
	"prompt6" text,
	"choice1" text,
	"choice2" text,
	"choice3" text,
	"choice4" text,
	"choice5" text,
	"choice6" text,
	"topicid" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matching_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"matching_id" text NOT NULL,
	"answers" jsonb,
	"score" integer,
	"max_score" integer,
	"is_correct" boolean,
	"time_start" timestamp DEFAULT now(),
	"time_end" timestamp,
	"duration_seconds" integer,
	"attempt_number" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pending_access_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"google_email" text NOT NULL,
	"full_name" text NOT NULL,
	"google_id" text NOT NULL,
	"request_date" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"processed_at" timestamp,
	"processed_by" text
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text,
	"randomorder" text,
	"questionlevel" text,
	"contentid" text,
	"question_type" text,
	"noi_dung" text,
	"video" text,
	"picture" text,
	"cau_tra_loi_1" text,
	"cau_tra_loi_2" text,
	"cau_tra_loi_3" text,
	"cau_tra_loi_4" text,
	"correct_choice" text,
	"writing_choice" text,
	"time" text,
	"explanation" text,
	"questionorder" text,
	"tg_tao" text,
	"answer" text
);
--> statement-breakpoint
CREATE TABLE "student_streaks" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_try" (
	"id" text PRIMARY KEY NOT NULL,
	"answer_choice" text,
	"assignment_student_try_id" text,
	"currentindex" integer,
	"hocsinh_id" text,
	"question_id" text,
	"quiz_result" text,
	"score" integer,
	"showcontent" text,
	"time_end" timestamp with time zone,
	"time_start" timestamp with time zone,
	"update" timestamp,
	"writing_answer" text
);
--> statement-breakpoint
CREATE TABLE "student_try_content" (
	"id" text PRIMARY KEY NOT NULL,
	"contentid" text,
	"hocsinh_id" text,
	"student_try_id" text,
	"time_end" timestamp with time zone,
	"time_start" timestamp with time zone,
	"update" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topic" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text,
	"short_summary" text,
	"challengesubject" text,
	"image" text,
	"parentid" text,
	"showstudent" boolean
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"full_name" text,
	"assignment_student_try_id" text,
	"assignment_id" text,
	"email" text,
	"topic_id" text,
	"content_id" text,
	"typeoftaking" text,
	"question_id" text,
	"meraki_email" text,
	"answer_choice" text,
	"quiz_result" text,
	"show" boolean,
	"category" text,
	"session_shown_ids" text,
	"content_viewed" integer,
	"total_score" integer,
	"question_viewed" integer,
	"time_start" text,
	"time_end" text,
	"correct_answer" text,
	"show_content" boolean,
	"current_index" integer,
	"writing_answer" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" text PRIMARY KEY NOT NULL,
	"topicid" text,
	"contentid" text,
	"videolink" text,
	"videoupload" text,
	"showvideo" text,
	"video_name" text,
	"description" text,
	"first" text,
	"second" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "writing_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"prompts" jsonb,
	"suggestions" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "writing_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"prompt_id" text NOT NULL,
	"title" text,
	"opening_paragraph" text,
	"body_paragraph_1" text,
	"body_paragraph_2" text,
	"body_paragraph_3" text,
	"conclusion_paragraph" text,
	"full_essay" text,
	"ai_feedback" jsonb,
	"overall_score" integer,
	"paragraph_scores" jsonb,
	"word_count" integer,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
