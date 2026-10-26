-- Área nova do CMS: rodízio de organistas.
--
-- Fica numa migração só dela porque o Postgres não deixa usar um valor de enum
-- na mesma transação em que ele foi criado — e a migração seguinte usa
-- `pode_editar('rodizios')` nas políticas.

alter type public.portal_area add value if not exists 'rodizios';
