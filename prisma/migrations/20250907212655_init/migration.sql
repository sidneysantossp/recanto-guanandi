-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `tipo` ENUM('admin', 'proprietario') NOT NULL DEFAULT 'proprietario',
    `cpf` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `endereco` JSON NULL,
    `situacao` ENUM('ativo', 'inativo', 'inadimplente') NOT NULL DEFAULT 'ativo',
    `dataUltimoLogin` DATETIME(3) NULL,
    `avatar` VARCHAR(191) NOT NULL DEFAULT '',
    `notificacoes` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_cpf_key`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `endereco` JSON NULL,
    `categorias` JSON NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `providers` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cpfCnpj` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `especialidades` JSON NULL,
    `empresaVinculada` VARCHAR(191) NULL,
    `endereco` JSON NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgets` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `valorEstimado` DOUBLE NULL,
    `empresa` VARCHAR(191) NULL,
    `prestador` VARCHAR(191) NULL,
    `status` ENUM('aberto', 'em_analise', 'aprovado', 'rejeitado', 'concluido') NOT NULL DEFAULT 'aberto',
    `solicitante` VARCHAR(191) NOT NULL,
    `dataAbertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataFechamento` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_arquivos` (
    `id` VARCHAR(191) NOT NULL,
    `budgetId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_comentarios` (
    `id` VARCHAR(191) NOT NULL,
    `budgetId` VARCHAR(191) NOT NULL,
    `autor` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_historico` (
    `id` VARCHAR(191) NOT NULL,
    `budgetId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('criado', 'status_alterado', 'comentario_adicionado', 'anexo_adicionado', 'atualizado') NOT NULL DEFAULT 'atualizado',
    `descricao` VARCHAR(191) NULL,
    `usuario` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadados` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boletos` (
    `id` VARCHAR(191) NOT NULL,
    `numeroDocumento` VARCHAR(191) NOT NULL,
    `proprietario` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `valor` DOUBLE NOT NULL,
    `dataVencimento` DATETIME(3) NOT NULL,
    `dataEmissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataPagamento` DATETIME(3) NULL,
    `status` ENUM('pendente', 'pago', 'vencido', 'cancelado') NOT NULL DEFAULT 'pendente',
    `tipoPagamento` ENUM('boleto', 'pix', 'dinheiro', 'transferencia', 'cartao') NOT NULL DEFAULT 'boleto',
    `codigoBarras` VARCHAR(191) NULL,
    `linhaDigitavel` VARCHAR(191) NULL,
    `chavePix` VARCHAR(191) NULL,
    `qrCodePix` TEXT NULL,
    `txidPix` VARCHAR(191) NULL,
    `metodoPagamento` ENUM('boleto', 'pix', 'dinheiro', 'transferencia', 'cartao') NOT NULL DEFAULT 'boleto',
    `categoria` ENUM('taxa_condominio', 'taxa_extra', 'multa', 'obra', 'manutencao', 'outros') NOT NULL DEFAULT 'taxa_condominio',
    `observacoes` TEXT NULL,
    `valorJuros` DOUBLE NOT NULL DEFAULT 0,
    `valorMulta` DOUBLE NOT NULL DEFAULT 0,
    `valorDesconto` DOUBLE NOT NULL DEFAULT 0,
    `valorTotal` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `boletos_numeroDocumento_key`(`numeroDocumento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `tipo` ENUM('comunicado', 'ata', 'assembleia', 'cobranca', 'manutencao', 'urgente') NOT NULL,
    `prioridade` ENUM('baixa', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
    `autor` VARCHAR(191) NOT NULL,
    `dataPublicacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataExpiracao` DATETIME(3) NULL,
    `status` ENUM('rascunho', 'publicado', 'arquivado') NOT NULL DEFAULT 'rascunho',
    `configuracoes` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_anexos` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_destinatarios` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('todos', 'especificos', 'inadimplentes', 'ativos') NOT NULL DEFAULT 'todos',
    `usuario` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_visualizacoes` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `usuario` VARCHAR(191) NOT NULL,
    `visualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `notification_visualizacoes_notificationId_usuario_key`(`notificationId`, `usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_comentarios` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `autor` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `providers` ADD CONSTRAINT `providers_empresaVinculada_fkey` FOREIGN KEY (`empresaVinculada`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_empresa_fkey` FOREIGN KEY (`empresa`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_prestador_fkey` FOREIGN KEY (`prestador`) REFERENCES `providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_solicitante_fkey` FOREIGN KEY (`solicitante`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_arquivos` ADD CONSTRAINT `budget_arquivos_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_comentarios` ADD CONSTRAINT `budget_comentarios_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_comentarios` ADD CONSTRAINT `budget_comentarios_autor_fkey` FOREIGN KEY (`autor`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_historico` ADD CONSTRAINT `budget_historico_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_historico` ADD CONSTRAINT `budget_historico_usuario_fkey` FOREIGN KEY (`usuario`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boletos` ADD CONSTRAINT `boletos_proprietario_fkey` FOREIGN KEY (`proprietario`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_autor_fkey` FOREIGN KEY (`autor`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_anexos` ADD CONSTRAINT `notification_anexos_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_destinatarios` ADD CONSTRAINT `notification_destinatarios_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_destinatarios` ADD CONSTRAINT `notification_destinatarios_usuario_fkey` FOREIGN KEY (`usuario`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_visualizacoes` ADD CONSTRAINT `notification_visualizacoes_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_visualizacoes` ADD CONSTRAINT `notification_visualizacoes_usuario_fkey` FOREIGN KEY (`usuario`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_comentarios` ADD CONSTRAINT `notification_comentarios_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_comentarios` ADD CONSTRAINT `notification_comentarios_autor_fkey` FOREIGN KEY (`autor`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
