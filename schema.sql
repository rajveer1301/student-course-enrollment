--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: colleges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.colleges (
    unique_id character varying NOT NULL,
    name character varying NOT NULL
);


--
-- Name: course_timetables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_timetables (
    unique_id character varying NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    course_id character varying
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    unique_id character varying NOT NULL,
    name character varying NOT NULL,
    course_code character varying NOT NULL,
    college_id character varying NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: query-result-cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."query-result-cache" (
    id integer NOT NULL,
    identifier character varying,
    "time" bigint NOT NULL,
    duration integer NOT NULL,
    query text NOT NULL,
    result text NOT NULL
);


--
-- Name: query-result-cache_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."query-result-cache_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: query-result-cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."query-result-cache_id_seq" OWNED BY public."query-result-cache".id;


--
-- Name: student_course_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_course_mapping (
    unique_id character varying NOT NULL,
    student_id character varying NOT NULL,
    course_id character varying NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    unique_id character varying NOT NULL,
    name character varying NOT NULL,
    college_id character varying NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: query-result-cache id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."query-result-cache" ALTER COLUMN id SET DEFAULT nextval('public."query-result-cache_id_seq"'::regclass);


--
-- Name: courses PK_64f2204ea82dc468c76caa0fcc8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "PK_64f2204ea82dc468c76caa0fcc8" PRIMARY KEY (unique_id);


--
-- Name: colleges PK_66961f03bbfc8d22b9bd83deda5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colleges
    ADD CONSTRAINT "PK_66961f03bbfc8d22b9bd83deda5" PRIMARY KEY (unique_id);


--
-- Name: query-result-cache PK_6a98f758d8bfd010e7e10ffd3d3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."query-result-cache"
    ADD CONSTRAINT "PK_6a98f758d8bfd010e7e10ffd3d3" PRIMARY KEY (id);


--
-- Name: course_timetables PK_8426601381f4f392aad1e143795; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_timetables
    ADD CONSTRAINT "PK_8426601381f4f392aad1e143795" PRIMARY KEY (unique_id);


--
-- Name: students PK_84997e180eaff3a80d54b94a693; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "PK_84997e180eaff3a80d54b94a693" PRIMARY KEY (unique_id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: student_course_mapping PK_9b4aba892be22533b28d1df71da; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_mapping
    ADD CONSTRAINT "PK_9b4aba892be22533b28d1df71da" PRIMARY KEY (unique_id);


--
-- Name: course_timetables date_start_end_time_course_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_timetables
    ADD CONSTRAINT date_start_end_time_course_unique UNIQUE (course_id, start_time, end_time, date);


--
-- Name: courses name_college_unique_check; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT name_college_unique_check UNIQUE (name, college_id);


--
-- Name: student_course_mapping student_course_unique_contraint; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_mapping
    ADD CONSTRAINT student_course_unique_contraint UNIQUE (student_id, course_id);


--
-- Name: IDX_1f4ec087094a2e63fb2e5e5031; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1f4ec087094a2e63fb2e5e5031" ON public.students USING btree (college_id);


--
-- Name: IDX_3d8ff1ddbcc425ea2176ce669a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3d8ff1ddbcc425ea2176ce669a" ON public.student_course_mapping USING btree (student_id);


--
-- Name: IDX_64f2204ea82dc468c76caa0fcc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_64f2204ea82dc468c76caa0fcc" ON public.courses USING btree (unique_id);


--
-- Name: IDX_66961f03bbfc8d22b9bd83deda; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_66961f03bbfc8d22b9bd83deda" ON public.colleges USING btree (unique_id);


--
-- Name: IDX_8426601381f4f392aad1e14379; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8426601381f4f392aad1e14379" ON public.course_timetables USING btree (unique_id);


--
-- Name: IDX_84997e180eaff3a80d54b94a69; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_84997e180eaff3a80d54b94a69" ON public.students USING btree (unique_id);


--
-- Name: IDX_9b4aba892be22533b28d1df71d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9b4aba892be22533b28d1df71d" ON public.student_course_mapping USING btree (unique_id);


--
-- Name: IDX_b842812430f192167d10f9f99d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b842812430f192167d10f9f99d" ON public.courses USING btree (course_code);


--
-- Name: IDX_cb8f0b088b208282dada288e10; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cb8f0b088b208282dada288e10" ON public.student_course_mapping USING btree (course_id);


--
-- Name: IDX_e6c557f8d705614b735e1462ee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e6c557f8d705614b735e1462ee" ON public.courses USING btree (college_id);


--
-- Name: students FK_1f4ec087094a2e63fb2e5e5031e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "FK_1f4ec087094a2e63fb2e5e5031e" FOREIGN KEY (college_id) REFERENCES public.colleges(unique_id) ON DELETE CASCADE;


--
-- Name: course_timetables FK_29592b3a4634a39da34c3109622; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_timetables
    ADD CONSTRAINT "FK_29592b3a4634a39da34c3109622" FOREIGN KEY (course_id) REFERENCES public.courses(unique_id) ON DELETE CASCADE;


--
-- Name: student_course_mapping FK_3d8ff1ddbcc425ea2176ce669af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_mapping
    ADD CONSTRAINT "FK_3d8ff1ddbcc425ea2176ce669af" FOREIGN KEY (student_id) REFERENCES public.students(unique_id) ON DELETE CASCADE;


--
-- Name: student_course_mapping FK_cb8f0b088b208282dada288e102; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_course_mapping
    ADD CONSTRAINT "FK_cb8f0b088b208282dada288e102" FOREIGN KEY (course_id) REFERENCES public.courses(unique_id) ON DELETE CASCADE;


--
-- Name: courses FK_e6c557f8d705614b735e1462ee7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "FK_e6c557f8d705614b735e1462ee7" FOREIGN KEY (college_id) REFERENCES public.colleges(unique_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

