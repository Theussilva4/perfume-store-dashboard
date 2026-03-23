import { useEffect, useState } from "react";
import { Users, Plus, Search, Pencil, Trash2, Package, TrendingUp, Percent } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { getCliente, createCliente, updateCliente } from "@/services/clienteService";
import { toast } from "sonner";
import { Cliente } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const clienteVazio: Omit<Cliente, "codcliente"> = {
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  data_cadastro: "",
  ativo: "S",
};


function mapearCliente(c: any): Cliente {
  return {
    codcliente: c.codcliente,
    nome: c.nome|| "",
    cpf_cnpj: c.cpf_cnpj|| "",
    telefone: c.telefone|| "",
    email: c.email || "",
    endereco: c.endereco|| "",
    numero: c.numero|| "",
    bairro: c.bairro|| "",
    cidade: c.cidade|| "",
    estado: c.estado|| "",
    cep: c.cep|| "",
    data_cadastro: c.data_cadastro|| "",
    ativo: c.ativo|| "S"
  }
}


const Clients = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Omit<Cliente, "codcliente">>(clienteVazio);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [ListaClientes, setListaClientes] = useState<Cliente[]>([]);


  useEffect(() => {
    carregarClientes();
  }, []);

  const abrirNovo = () => {
    setEditandoCliente(null);
    setForm(clienteVazio);
    setDialogOpen(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    setEditandoCliente(cliente);
    setForm({ ...cliente });
    setDialogOpen(true);
  };





  async function carregarClientes() {
    try {
      const data = await getCliente();
      const lista = Array.isArray(data) ? data : [];
      setListaClientes(lista.map(mapearCliente));
    } catch (error) {
      console.log(error);
      toast.error("Erro ao carregar clientes")
    }
  }
 const limpar = (v: string) => v.replace(/\D/g, "");

const filtrados = ListaClientes.filter((c) => {
  const termo = search.toLowerCase();

  return (
    c.nome?.toLowerCase().includes(termo) ||
    limpar(c.telefone || "").includes(limpar(search)) ||
    limpar(c.cpf_cnpj || "").includes(limpar(search)) ||
    c.email?.toLowerCase().includes(termo)
  );
});

  const ordenados = [...filtrados].sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );

  const handleSalvar = async () => {
    if(!validarCpfCnpj(form.cpf_cnpj)){
      toast.error("CPF ou CNPJ INVALIDO");
    }
    try {
      if (editandoCliente) {
        await updateCliente(editandoCliente.codcliente, form);
        toast.success("Cliente atualizado!");
      } else {
        await createCliente(form);
        toast.success("Cliente criado!");
      }

      await carregarClientes();
      setDialogOpen(false);
      setEditandoCliente(null);

    } catch (error) {
      toast.error("Erro ao salvar cliente");
    }
  };
  function validarCPF(cpf: string) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}
function validarCNPJ(cnpj: string) {
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;

  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

function validarCpfCnpj(valor: string) {
  const numero = valor.replace(/\D/g, "");

  if (numero.length === 11) return validarCPF(numero);
  if (numero.length === 14) return validarCNPJ(numero);

  return false;
}

function formatarCpfCnpj(valor: string) {
  valor = valor.replace(/\D/g, "");

  if (valor.length <= 11) {
    return valor
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return valor
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
  return (
    <>
      <div className="space-y-6 animate-fade-in-up">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-primary">
              Clientes
            </h2>
            <p className="text-sm text-muted-foreground">
              {ListaClientes.length} clientes cadastrados
            </p>
          </div>

          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* BUSCA */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, telefone ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* LISTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordenados.map((cliente) => (
            <div
              key={cliente.codcliente}
              className="bg-card rounded-lg border p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {cliente.nome?.charAt(0)}
                  </span>
                </div>

                <button
                  onClick={() => abrirEdicao(cliente)}
                  className="p-1.5 rounded-md hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h3 className="font-medium text-sm">{cliente.nome}</h3>
                <p className="text-xs text-muted-foreground">
                  Código: {cliente.codcliente}
                </p>
                {cliente.telefone && (
                  <p className="text-xs text-muted-foreground">
                    Tel: {cliente.telefone}
                  </p>
                )}
              </div>

              <button
                className={`text-xs py-1 rounded-md border ${cliente.ativo === "S"
                    ? "border-primary text-primary"
                    : "border-destructive text-destructive"
                  }`}
              >
                {cliente.ativo === "S" ? "Ativo" : "Inativo"}
              </button>
            </div>
          ))}
        </div>

        {ordenados.length === 0 && (
          <div className="text-center text-muted-foreground">
            <Users className="mx-auto mb-2 opacity-30" />
            Nenhum cliente encontrado
          </div>
        )}
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editandoCliente ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) =>
                  setForm({ ...form, nome: e.target.value })
                }
              />
            </div>

            <div>
              <Label>CPF/CNPJ</Label>
              <Input
                value={formatarCpfCnpj(form.cpf_cnpj)}
                onChange={(e) =>
                  setForm({ ...form, cpf_cnpj: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) =>
                  setForm({ ...form, telefone: e.target.value })
                }
              />
            </div>

            <div className="col-span-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input
                value={form.endereco}
                onChange={(e) =>
                  setForm({ ...form, endereco: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Número</Label>
              <Input
                value={form.numero}
                onChange={(e) =>
                  setForm({ ...form, numero: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Bairro</Label>
              <Input
                value={form.bairro}
                onChange={(e) =>
                  setForm({ ...form, bairro: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) =>
                  setForm({ ...form, cidade: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Estado</Label>
              <Input
                value={form.estado}
                onChange={(e) =>
                  setForm({ ...form, estado: e.target.value })
                }
              />
            </div>

            <div>
              <Label>CEP</Label>
              <Input
                value={form.cep}
                onChange={(e) =>
                  setForm({ ...form, cep: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editandoCliente ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Clients;

{/* <div className="flex gap-4 mt-3">
  <div>
    <p className="text-lg font-semibold text-foreground">{cliente.quantidadePedidos}</p>
    <p className="text-[10px] text-muted-foreground">pedidos</p>
  </div>
  <div>
    <p className="text-lg font-semibold text-primary">R$ {cliente.totalGasto.toLocaleString("pt-BR")}</p>
    <p className="text-[10px] text-muted-foreground">total comprado</p>
  </div>
</div> */}