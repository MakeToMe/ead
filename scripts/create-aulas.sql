create table
  rarcursos.aulas (
    id uuid not null default gen_random_uuid (),
    curso_id uuid not null,
    modulo_id uuid not null,
    titulo character varying(255) not null,
    descricao text null,
    tipo character varying(50) null default 'video'::character varying,
    conteudo text null,
    media_url character varying(255) null,
    duracao integer null,
    ativo boolean null default true,
    criado_em timestamp without time zone null default now(),
    atualizado_em timestamp without time zone null default now(),
    constraint aulas_pkey primary key (id),
    constraint aulas_curso_id_fkey foreign key (curso_id) references rarcursos.cursos (id) on delete cascade,
    constraint aulas_modulo_id_fkey foreign key (modulo_id) references rarcursos.modulos (id) on delete cascade,
    constraint aulas_tipo_check check (
      (
        (tipo)::text = any (
          (
            array[
              'video'::character varying,
              'texto'::character varying,
              'quiz'::character varying,
              'projeto'::character varying
            ]
          )::text[]
        )
      )
    )
  ) tablespace pg_default;

create trigger trg_check_curso_modulo_consistency before insert
or
update on rarcursos.aulas for each row
execute function check_curso_modulo_consistency ();