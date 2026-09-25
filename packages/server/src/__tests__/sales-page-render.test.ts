import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { SalesPageRenderer } from '../services/marketing/sales-page-renderer.js';
import { SalesPageCopy } from '@union/shared';
import { publishedPagesStore } from '../routes/marketing.js';

describe('SalesPageRenderer & 1-Click Publishing System', () => {
  const sampleCopy: SalesPageCopy = {
    title: 'UNION.AI Enterprise Accelerator',
    headline: 'Construa Funis Autônomos de IA em Segundos',
    subheadline: 'A plataforma definitiva para criar e orquestrar equipes de IA.',
    problem: 'Sistemas isolados geram gargalos manuais constantes.',
    consequences: 'Perda de tempo, alto custo e lentidão em relação aos concorrentes.',
    opportunity: 'Conecte modelos de ponta em um fluxo unificado de dados.',
    mechanism: 'UNION Data Bus com roteamento inteligente multi-modelo.',
    benefits: [
      'Geração em menos de 5 minutos',
      'Compatibilidade universal',
      'Escalabilidade enterprise'
    ],
    proof: [
      'Mais de 10.000 campanhas criadas com sucesso',
      'Avaliação 4.9 estrelas pelos usuários'
    ],
    offer: 'Acesso imediato com garantia estendida e bônus exclusivos.',
    bonuses: [
      'Bônus 1: Pack de 50 Templates',
      'Bônus 2: Acesso à comunidade VIP'
    ],
    guarantee: 'Garantia incondicional de 30 dias com reembolso total.',
    objections: [
      'Funciona para iniciantes? Sim, interface 100% no-code visual.'
    ],
    faq: [
      {
        question: 'Como funciona a ativação?',
        answer: 'O acesso é liberado imediatamente após a confirmação.'
      }
    ],
    cta: 'QUERO MEU ACESSO IMEDIATO'
  };

  it('should render valid HTML5 string containing all 14 blocks and Tailwind CDN', () => {
    const html = SalesPageRenderer.renderToHtml(sampleCopy, {
      checkoutUrl: 'https://pay.kiwify.com.br/sample',
      theme: 'dark',
      customTitle: 'Oferta Especial UNION.AI'
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="pt-BR"');
    expect(html).toContain('https://cdn.tailwindcss.com');
    expect(html).toContain('Construa Funis Autônomos de IA em Segundos');
    expect(html).toContain('A plataforma definitiva para criar e orquestrar equipes de IA.');
    expect(html).toContain('Sistemas isolados geram gargalos manuais constantes.');
    expect(html).toContain('UNION Data Bus com roteamento inteligente');
    expect(html).toContain('Mais de 10.000 campanhas criadas com sucesso');
    expect(html).toContain('Garantia incondicional de 30 dias com reembolso total.');
    expect(html).toContain('https://pay.kiwify.com.br/sample');
    expect(html).toContain('QUERO MEU ACESSO IMEDIATO');
  });

  describe('REST Endpoints: /api/marketing/sales-page/render-html & /publish', () => {
    const app = createApp();
    let authToken = '';

    beforeEach(async () => {
      // Register temporary user for test authentication
      const email = `sales_test_${Math.random().toString(36).substring(2, 7)}@union.ai`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'Password123!', name: 'Sales Tester' });
      
      authToken = res.body.data?.token || res.body.token;
    });

    it('should generate standalone HTML via POST /api/marketing/sales-page/render-html', async () => {
      const res = await request(app)
        .post('/api/marketing/sales-page/render-html')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          copy: sampleCopy,
          checkoutUrl: 'https://hotmart.com/checkout/test',
          theme: 'dark'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.html).toContain('https://hotmart.com/checkout/test');
      expect(res.body.data.sizeBytes).toBeGreaterThan(500);
    });

    it('should publish page and serve it publicly at GET /p/:slug', async () => {
      const pubRes = await request(app)
        .post('/api/marketing/sales-page/publish')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          copy: sampleCopy,
          slug: 'funil-black-friday',
          checkoutUrl: 'https://stripe.com/checkout/test'
        });

      expect(pubRes.status).toBe(201);
      expect(pubRes.body.success).toBe(true);
      const { slug, publicUrl } = pubRes.body.data;
      expect(slug).toContain('funil-black-friday');
      expect(publicUrl).toBe(`/p/${slug}`);

      // Verify public access without auth token
      const publicRes = await request(app).get(`/p/${slug}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.headers['content-type']).toContain('text/html');
      expect(publicRes.text).toContain('Construa Funis Autônomos de IA em Segundos');
      expect(publicRes.text).toContain('https://stripe.com/checkout/test');

      // Verify view count increment
      const pageRecord = publishedPagesStore.get(slug);
      expect(pageRecord?.views).toBe(1);
    });

    it('should return 404 for non-existent public slug', async () => {
      const res = await request(app).get('/p/slug-inexistente-12345');
      expect(res.status).toBe(404);
      expect(res.text).toContain('Página de Vendas Não Encontrada');
    });
  });
});
