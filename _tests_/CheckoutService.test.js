import { jest } from '@jest/globals';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { CheckoutService } from '../src/services/CheckoutService.js';

describe('CheckoutService', () => {
    describe('quando o pagamento falha', () => {
        it('retorna null sem enviar e-mail', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPadrao())
                .build();
            const gatewayPagamento = {
                cobrar: jest.fn().mockResolvedValue({ success: false })
            };
            const pedidoRepository = {
                salvar: jest.fn()
            };
            const emailService = {
                enviarEmail: jest.fn()
            };
            const checkoutService = new CheckoutService(
                gatewayPagamento,
                pedidoRepository,
                emailService
            );

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, 'cartao-teste');

            // Assert
            expect(pedido).toBeNull();
            expect(emailService.enviarEmail).not.toHaveBeenCalled();
        });
    });
});
