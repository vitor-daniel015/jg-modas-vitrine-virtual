# JG Modas - Vitrine Virtual

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

Uma aplicação web moderna de vitrine virtual e landing page desenvolvida para a **JG Modas**. O projeto serve como catálogo digital para facilitar a visualização de produtos, promoções e o contato direto via WhatsApp, contando também com um painel administrativo completo para gestão de conteúdo.

## 📋 Funcionalidades

### Área Pública (Cliente)
* **Vitrine Interativa:** Apresentação de produtos em destaque e carrossel promocional.
* **Catálogo Completo:** Visualização de produtos filtrados por categorias.
* **Detalhes do Produto:** Preço, tamanhos disponíveis e fotos.
* **Integração com WhatsApp:** Botões de "Call to Action" que direcionam o cliente para o WhatsApp da loja para finalizar a compra/reserva.
* **Páginas Institucionais:** "Nosso Estilo" e informações sobre a tradição da loja.

### Painel Administrativo (Restrito)
Gestão completa do conteúdo do site via interface amigável:
* **Produtos:** Adicionar, editar e remover produtos (com upload de imagens).
* **Categorias:** Gerenciar categorias de roupas (Masculino, Feminino, Unissex).
* **Carrossel:** Alterar os banners da página inicial.
* **Avaliações:** Gerenciar depoimentos de clientes exibidos no site.
* **Informações da Loja:** Atualizar textos institucionais, links sociais e número de contato.

## 🚀 Tecnologias Utilizadas

* **Frontend:** React, TypeScript, Vite
* **Estilização:** Tailwind CSS, Shadcn/ui (Radix UI)
* **Gerenciamento de Estado/Data:** React Query (@tanstack/react-query)
* **Roteamento:** React Router DOM
* **Formulários:** React Hook Form + Zod
* **Backend / Banco de Dados:** Supabase (PostgreSQL, Auth, Storage)
* **Ícones:** Lucide React

## 🗄️ Estrutura do Banco de Dados (Supabase)

O projeto utiliza as seguintes tabelas principais:
* `products`: Armazena informações dos itens (nome, preço, estoque, imagens).
* `categories`: Categorização dos produtos.
* `reviews`: Depoimentos de clientes.
* `store_info`: Configurações dinâmicas do site (títulos, contatos).

## 🔧 Pré-requisitos

* Node.js (versão 18+ ou superior)
* Gerenciador de pacotes (npm, yarn ou bun)
* Conta no Supabase

## 📦 Como rodar o projeto

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/vitor-daniel015/jg-modas-vitrine-virtual.git](https://github.com/vitor-daniel015/jg-modas-vitrine-virtual.git)
    cd jg-modas-vitrine-virtual
    ```

2.  **Instale as dependências:**
    ```bash
    # Se estiver usando npm
    npm install

    # Se estiver usando bun (recomendado, visto o arquivo bun.lockb)
    bun install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Supabase:
    ```env
    VITE_SUPABASE_URL=sua_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
    ```

4.  **Configure o Banco de Dados:**
    Execute os scripts SQL localizados na pasta `supabase/migrations` no editor SQL do seu painel Supabase para criar as tabelas e políticas de segurança (RLS).

5.  **Execute o projeto:**
    ```bash
    npm run dev
    # ou
    bun dev
    ```

O projeto estará rodando em `http://localhost:8080` (ou a porta indicada pelo Vite).

## 🛡️ Autenticação Admin

Para acessar a rota `/admin`, é necessário estar autenticado. A autenticação é gerenciada pelo Supabase Auth. Certifique-se de criar um usuário no painel do Supabase e configurar a lógica de verificação de administrador (campo `isAdmin` ou tabela de perfis, conforme implementado nos hooks).

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

1.  Faça um Fork do projeto
2.  Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`)
3.  Faça o Commit (`git commit -m 'Adicionando funcionalidade X'`)
4.  Faça o Push (`git push origin feature/MinhaFeature`)
5.  Abra um Pull Request

---
Desenvolvido por [Vitor Daniel](https://github.com/vitor-daniel015)
