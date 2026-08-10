/**
 * Campos de formulário do CMS.
 *
 * Tudo `<input>`/`<select>` nativo, ligado a Server Action por `<form action>`.
 * A validação de verdade acontece no servidor, com Zod — o `required` do HTML é
 * só conveniência.
 *
 * O CMS **exige JavaScript**: Server Action depende do runtime do React para
 * resolver a ação. Isso vale só para `/admin`; o portal público continua
 * inteiro renderizado no servidor.
 */

type Base = {
  nome: string;
  rotulo: string;
  ajuda?: string;
  obrigatorio?: boolean;
};

function Envolve({
  rotulo,
  ajuda,
  obrigatorio,
  htmlFor,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  obrigatorio?: boolean;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-azul text-[12.5px] font-bold">
        {rotulo}
        {obrigatorio && <span className="text-vermelho"> *</span>}
      </label>
      {children}
      {ajuda && <span className="text-[11.5px] opacity-70">{ajuda}</span>}
    </div>
  );
}

const estilo =
  "border-cinza rounded-portal text-azul w-full border bg-white px-3 py-2 text-[13px]";

export function Texto({
  nome,
  rotulo,
  ajuda,
  obrigatorio,
  valor,
  tipo = "text",
  ...resto
}: Base & {
  valor?: string | number | null;
  tipo?: "text" | "date" | "time" | "url" | "email" | "number" | "password";
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Envolve rotulo={rotulo} ajuda={ajuda} obrigatorio={obrigatorio} htmlFor={nome}>
      <input
        id={nome}
        name={nome}
        type={tipo}
        required={obrigatorio}
        defaultValue={valor ?? ""}
        className={estilo}
        {...resto}
      />
    </Envolve>
  );
}

export function AreaTexto({
  nome,
  rotulo,
  ajuda,
  obrigatorio,
  valor,
  linhas = 3,
}: Base & { valor?: string | null; linhas?: number }) {
  return (
    <Envolve rotulo={rotulo} ajuda={ajuda} obrigatorio={obrigatorio} htmlFor={nome}>
      <textarea
        id={nome}
        name={nome}
        rows={linhas}
        required={obrigatorio}
        defaultValue={valor ?? ""}
        className={estilo}
      />
    </Envolve>
  );
}

export function Selecao({
  nome,
  rotulo,
  ajuda,
  obrigatorio,
  valor,
  opcoes,
  vazio = "—",
}: Base & {
  valor?: string | number | null;
  opcoes: { valor: string | number; nome: string }[];
  vazio?: string | null;
}) {
  return (
    <Envolve rotulo={rotulo} ajuda={ajuda} obrigatorio={obrigatorio} htmlFor={nome}>
      <select
        id={nome}
        name={nome}
        required={obrigatorio}
        defaultValue={valor ?? ""}
        className={estilo}
      >
        {vazio !== null && <option value="">{vazio}</option>}
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nome}
          </option>
        ))}
      </select>
    </Envolve>
  );
}

export function Marcar({
  nome,
  rotulo,
  ajuda,
  valor,
}: Omit<Base, "obrigatorio"> & { valor?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2">
        <input
          id={nome}
          name={nome}
          type="checkbox"
          defaultChecked={valor}
          value="sim"
          className="size-4"
        />
        <span className="text-azul text-[12.5px] font-bold">{rotulo}</span>
      </label>
      {ajuda && <span className="text-[11.5px] opacity-70">{ajuda}</span>}
    </div>
  );
}

// O envio de arquivo tem componente próprio: components/admin/campo-upload.tsx,
// porque o arquivo vai do navegador direto para o Storage.

export function Botao({
  children,
  variante = "primario",
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "perigo";
}) {
  const cores = {
    primario: "bg-azul text-white",
    secundario: "bg-superficie text-azul border-cinza border",
    perigo: "bg-vermelho text-white",
  }[variante];

  return (
    <button
      {...resto}
      className={`rounded-portal px-4 py-2 text-[12.5px] font-bold disabled:opacity-60 ${cores}`}
    >
      {children}
    </button>
  );
}
