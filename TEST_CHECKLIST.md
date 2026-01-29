# Checklist de Testes - Top Pastel

## Fase 1: Status do Servidor ✅
- [x] Servidor rodando
- [x] Sem erros de TypeScript
- [x] Sem erros de build
- [x] Dependências OK

## Fase 2: Página Inicial (Home)
- [ ] Layout carrega corretamente
- [ ] Imagens carregam
- [ ] Botão "Compre Agora" (hero) redireciona para /checkout
- [ ] Botão "Comprar Agora" (seção final) redireciona para /checkout
- [ ] Botão WhatsApp flutuante aparece no canto inferior direito
- [ ] Botão WhatsApp flutuante abre WhatsApp corretamente
- [ ] Navbar aparece e é funcional
- [ ] Footer aparece
- [ ] Responsividade mobile OK
- [ ] Responsividade tablet OK
- [ ] Responsividade desktop OK

## Fase 3: Calculadora de Frete
- [ ] CEP Portugal Continental (4810-433) calcula frete corretamente
- [ ] CEP Açores (9500-000) calcula frete corretamente
- [ ] CEP Madeira (9100-000) calcula frete corretamente
- [ ] CEP Espanha Península (28000) calcula frete corretamente
- [ ] Tipo de entrega "Ponto CTT" funciona
- [ ] Tipo de entrega "Domicílio" funciona
- [ ] Quantidade afeta o cálculo de frete
- [ ] Preço total é calculado corretamente (produto + frete)

## Fase 4: Página de Checkout
- [ ] Formulário carrega corretamente
- [ ] Campo "Nome Completo" funciona
- [ ] Campo "Email" funciona
- [ ] Campo "Telefone" funciona
- [ ] Campo "Endereço" funciona
- [ ] Campo "CEP" funciona
- [ ] Campo "Cidade" funciona
- [ ] Seletor "Método de Entrega" funciona
- [ ] Campo "Quantidade" funciona
- [ ] Validação: campos obrigatórios
- [ ] Validação: email válido
- [ ] Validação: quantidade mínima 1
- [ ] Botão "Ir para Pagamento" funciona
- [ ] Mensagens de erro aparecem corretamente
- [ ] Responsividade mobile OK
- [ ] Responsividade desktop OK

## Fase 5: Botão WhatsApp Flutuante
- [ ] Botão aparece no canto inferior direito
- [ ] Botão permanece visível ao scrollar
- [ ] Botão abre WhatsApp com número correto (+351 937675660)
- [ ] Botão tem cor verde adequada
- [ ] Botão tem ícone correto

## Fase 6: Integração Stripe
- [ ] Credenciais Stripe configuradas
- [ ] Sessão de checkout é criada corretamente
- [ ] Redirecionamento para Stripe funciona
- [ ] Página de sucesso funciona (após pagamento)
- [ ] Página de cancelamento funciona

## Fase 7: Erros e Correções
- [ ] Sem erros de console
- [ ] Sem erros de rede
- [ ] Sem erros de validação
- [ ] Sem valores NaN em cálculos
- [ ] Sem erros de banco de dados

## Fase 8: Performance e UX
- [ ] Página carrega em menos de 3 segundos
- [ ] Botões têm feedback visual ao clicar
- [ ] Formulário tem feedback de carregamento
- [ ] Mensagens de erro são claras
- [ ] Navegação é intuitiva
- [ ] Cores estão corretas
- [ ] Tipografia está legível

---

## Resumo de Testes
- Total de itens: 60
- Completados: 0
- Pendentes: 60
- Taxa de conclusão: 0%
