create table
  rarcursos.cursos (
    id uuid not null default gen_random_uuid (),
    titulo character varying(255) not null,
    descricao text null,
    imagem_url character varying(255) null,
    instrutor_id uuid null,
    nivel character varying(50) null,
    duracao_total integer null,
    ativo boolean null default true,
    criado_em timestamp without time zone null default now(),
    atualizado_em timestamp without time zone null default now(),
    constraint cursos_pkey primary key (id),
    constraint cursos_instrutor_id_fkey foreign key (instrutor_id) references rarcursos.users (uid) on delete set null,
    constraint cursos_nivel_check check (
      (
        (nivel)::text = any (
          (
            array[
              'iniciante'::character varying,
              'intermediario'::character varying,
              'avancado'::character varying
            ]
          )::text[]
        )
      )
    )
  ) tablespace pg_default;

create index if not exists idx_cursos_instrutor_ativo on rarcursos.cursos using btree (instrutor_id, ativo, criado_em desc) tablespace pg_default;

create index if not exists idx_cursos_nivel_ativo on rarcursos.cursos using btree (nivel, ativo, criado_em desc) tablespace pg_default;