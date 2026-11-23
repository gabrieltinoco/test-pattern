import { jest } from '@jest/globals';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';

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

    describe('quando um cliente Premium finaliza a compra', () => {
        it('aplica desconto de 10% e envia a mensagem de pedido aprovado', async () => {
            // Arrange
            const usuarioPremium = UserMother.umUsuarioPremium();
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Item 1', 100), new Item('Item 2', 100)])
                .build();
            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true })
            };
            const pedidoRepositoryStub = {
                salvar: jest.fn().mockImplementation(async pedido =>
                    new Pedido(123, pedido.carrinho, pedido.totalFinal, pedido.status)
                )
            };
            const emailMock = {
                enviarEmail: jest.fn().mockResolvedValue(undefined)
            };
            const checkoutService = new CheckoutService(
                gatewayStub,
                pedidoRepositoryStub,
                emailMock
            );

            // Act
            await checkoutService.processarPedido(carrinho, 'cartao-teste');

            // Assert
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, 'cartao-teste');
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                usuarioPremium.email,
                'Seu Pedido foi Aprovado!',
                'Pedido 123 no valor de R$180'
            );
        });
    });
});
