// Função para atualizar o histórico de abastecimentos
function atualizarHistorico(mesSelecionado = 'todos') {
    const dados = carregarDados();
    const dadosFiltrados = filtrarDadosPorMes(dados, mesSelecionado);
    const historicoDiv = document.getElementById('historicoAbastecimentos');
    historicoDiv.innerHTML = '';

    if (dadosFiltrados.length === 0) {
        historicoDiv.innerHTML = '<div class="mes-vazio">Nenhum abastecimento registrado neste mês.</div>';
        return;
    }

    dadosFiltrados.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'abastecimento-item';
        div.innerHTML = `
            <div class="item-content">
                <div class="item-imagem">
                    <img src="${getImagemAeronave(item.aeronave)}" alt="Aeronave ${item.aeronave}">
                </div>
                <div class="item-info">
                    <p><strong>Data:</strong> ${item.data} - ${item.horario}</p>
                    <p><strong>Aeronave:</strong> ${item.aeronave}</p>
                    <p><strong>MOGAS:</strong> ${item.mogas}L - <strong>AVGAS:</strong> ${item.avgas}L</p>
                    <p><strong>Responsável:</strong> ${item.responsavel}</p>
                </div>
            </div>
            <div class="acoes-item">
                <button class="btn-editar" onclick="iniciarEdicao(${index})">Editar</button>
                <button class="btn-remover" onclick="iniciarRemocao(${index})">Remover</button>
            </div>
        `;
        historicoDiv.appendChild(div);
    });

    atualizarGrafico(dadosFiltrados);
}

// Função para atualizar o gráfico
function atualizarGrafico(dados) {
    const ctx = document.getElementById('graficoConsumo').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.meuGrafico) {
        window.meuGrafico.destroy();
    }

    // Se não houver dados, mostrar mensagem
    if (!dados || dados.length === 0) {
        window.meuGrafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'MOGAS (L)',
                        data: [],
                        backgroundColor: 'rgba(128, 0, 128, 1)',
                        borderColor: 'rgba(128, 0, 128, 1)',
                    },
                    {
                        label: 'AVGAS (L)',
                        data: [],
                        backgroundColor: 'rgba(0, 123, 255, 1)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Consumo de Combustível por Aeronave',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    y: {
                        display: false
                    },
                    x: {
                        display: false
                    }
                }
            }
        });
        return;
    }

    const aeronaves = {};
    
    // Agrupar dados por aeronave
    dados.forEach(item => {
        if (!aeronaves[item.aeronave]) {
            aeronaves[item.aeronave] = {
                mogas: 0,
                avgas: 0
            };
        }
        aeronaves[item.aeronave].mogas += parseFloat(item.mogas);
        aeronaves[item.aeronave].avgas += parseFloat(item.avgas);
    });

    window.meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(aeronaves),
            datasets: [
                {
                    label: 'MOGAS (L)',
                    data: Object.values(aeronaves).map(a => a.mogas),
                    backgroundColor: '#9B4DCA',
                    borderColor: '#000000',
                    borderWidth: 0.5,
                    borderRadius: 4,
                    barThickness: 45,
                    maxBarThickness: 60
                },
                {
                    label: 'AVGAS (L)',
                    data: Object.values(aeronaves).map(a => a.avgas),
                    backgroundColor: '#0066CC',
                    borderColor: '#000000',
                    borderWidth: 0.5,
                    borderRadius: 4,
                    barThickness: 45,
                    maxBarThickness: 60
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        },
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const datasetIndex = context.datasetIndex;
                            const aeronave = Object.keys(aeronaves)[dataIndex];
                            const valor = context.raw;
                            const total = aeronaves[aeronave].mogas + aeronaves[aeronave].avgas;
                            const porcentagem = ((valor / total) * 100).toFixed(1);
                            
                            const tipo = datasetIndex === 0 ? 'MOGAS' : 'AVGAS';
                            return `${tipo}: ${valor.toFixed(1)}L (${porcentagem}%)`;
                        },
                        footer: (tooltipItems) => {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const aeronave = Object.keys(aeronaves)[dataIndex];
                            const total = aeronaves[aeronave].mogas + aeronaves[aeronave].avgas;
                            return `Total: ${total.toFixed(1)}L`;
                        }
                    }
                }
            }
        },
        plugins: [{
            afterDraw: function(chart) {
                const ctx = chart.ctx;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                
                chart.data.labels.forEach((label, i) => {
                    const mogas = chart.data.datasets[0].data[i];
                    const avgas = chart.data.datasets[1].data[i];
                    const total = mogas + avgas;
                    
                    if (total > 0) {
                        const meta0 = chart.getDatasetMeta(0);
                        const meta1 = chart.getDatasetMeta(1);
                        
                        // Total em litros
                        ctx.fillStyle = '#000000';
                        ctx.fillText(`Total: ${total.toFixed(1)}L`, 
                            (meta0.data[i].x + meta1.data[i].x) / 2, 
                            Math.min(meta0.data[i].y, meta1.data[i].y) - 25
                        );
                        
                        // Porcentagem MOGAS
                        if (mogas > 0) {
                            const porcentagemMogas = ((mogas / total) * 100).toFixed(1);
                            ctx.fillStyle = '#9B4DCA';
                            ctx.fillText(`${porcentagemMogas}%`, meta0.data[i].x, meta0.data[i].y - 10);
                        }
                        
                        // Porcentagem AVGAS
                        if (avgas > 0) {
                            const porcentagemAvgas = ((avgas / total) * 100).toFixed(1);
                            ctx.fillStyle = '#0066CC';
                            ctx.fillText(`${porcentagemAvgas}%`, meta1.data[i].x, meta1.data[i].y - 10);
                        }
                    }
                });
            }
        }]
    });
}

// Função para carregar dados do arquivo CSV (se existir)
function carregarDados() {
    const dados = localStorage.getItem('abastecimentos');
    return dados ? JSON.parse(dados) : [];
}

// Função para salvar dados no localStorage
function salvarDados(dados) {
    localStorage.setItem('abastecimentos', JSON.stringify(dados));
    atualizarReservatorioComHistorico();
}

// Função para obter a URL da imagem da aeronave
function getImagemAeronave(aeronave) {
    // Lista de aeronaves que usarão a imagem "aviao1"
    const aeronavesAviao1 = ['PT-NHO', 'PT-ABC']; // Adicione aqui os prefixos que usarão aviao1
    
    // Se a aeronave estiver na lista, usa aviao1.png, senão usa aviao.png
    return aeronavesAviao1.includes(aeronave) ? 'images/aviao1.png' : 'images/aviao.png';
}

// Função para filtrar dados por mês
function filtrarDadosPorMes(dados, mes) {
    if (mes === 'todos') return dados;
    
    return dados.filter(item => {
        const dataMes = new Date(item.data).getMonth() + 1; // +1 porque getMonth retorna 0-11
        return dataMes === parseInt(mes);
    });
}

// Senha do sistema
const SENHA_SISTEMA = "123456";

// Elementos do DOM
const loginModal = document.getElementById('loginModal');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCancelar = document.getElementById('btnCancelar');
const senhaInput = document.getElementById('senha');
let dadosParaRegistro = null;
let indiceEdicao = null;
let acaoAtual = null; // 'registrar', 'editar' ou 'remover'

// Função para iniciar edição
function iniciarEdicao(index) {
    const dados = carregarDados();
    const item = dados[index];
    indiceEdicao = index;

    // Preencher o formulário de edição
    document.getElementById('editData').value = item.data;
    document.getElementById('editHorario').value = item.horario;
    document.getElementById('editAeronave').value = item.aeronave;
    document.getElementById('editMogas').value = item.mogas;
    document.getElementById('editAvgas').value = item.avgas;
    document.getElementById('editResponsavel').value = item.responsavel;

    // Mostrar modal de edição
    document.getElementById('editModal').classList.add('active');
}

// Função para iniciar remoção
function iniciarRemocao(index) {
    indiceEdicao = index;
    acaoAtual = 'remover';
    document.getElementById('modalTitle').textContent = 'Confirmar Remoção';
    mostrarModalSenha();
}

// Função para mostrar o modal de senha
function mostrarModalSenha() {
    loginModal.classList.add('active');
    senhaInput.value = '';
    senhaInput.focus();
}

// Função para esconder o modal de senha
function esconderModalSenha() {
    loginModal.classList.remove('active');
    senhaInput.value = '';
    // Resetar o título do modal
    document.getElementById('modalTitle').textContent = 'Confirmar Registro';
    // Limpar a ação atual se não for confirmada
    if (acaoAtual === 'upload' || acaoAtual === 'download') {
        acaoAtual = null;
    }
}

// Event Listener para o formulário de edição
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    acaoAtual = 'editar';
    
    dadosParaRegistro = {
        data: document.getElementById('editData').value,
        horario: document.getElementById('editHorario').value,
        aeronave: document.getElementById('editAeronave').value,
        mogas: document.getElementById('editMogas').value,
        avgas: document.getElementById('editAvgas').value,
        responsavel: document.getElementById('editResponsavel').value
    };

    document.getElementById('editModal').classList.remove('active');
    document.getElementById('modalTitle').textContent = 'Confirmar Edição';
    mostrarModalSenha();
});

// Função para fazer download do CSV com senha
function iniciarDownloadCSV() {
    acaoAtual = 'download';
    document.getElementById('modalTitle').textContent = 'Confirmar Download';
    mostrarModalSenha();
}

// Função para iniciar upload do CSV
function iniciarUploadCSV() {
    acaoAtual = 'upload';
    document.getElementById('modalTitle').textContent = 'Confirmar Upload';
    mostrarModalSenha();
}

// Modificar o Event Listener do botão confirmar
btnConfirmar.addEventListener('click', function() {
    const senha = senhaInput.value;
    
    if (senha === SENHA_SISTEMA) {
        const dados = carregarDados();

        switch(acaoAtual) {
            case 'registrar':
                dados.push(dadosParaRegistro);
                document.getElementById('combustivelForm').reset();
                break;
            case 'editar':
                dados[indiceEdicao] = dadosParaRegistro;
                break;
            case 'remover':
                dados.splice(indiceEdicao, 1);
                break;
            case 'download':
                esconderModalSenha();
                downloadCSV();
                document.getElementById('modalTitle').textContent = 'Confirmar Registro';
                return;
            case 'upload':
                esconderModalSenha();
                document.getElementById('fileUpload').click();
                document.getElementById('modalTitle').textContent = 'Confirmar Registro';
                return;
        }

        salvarDados(dados);
        atualizarHistorico();
        esconderModalSenha();
        document.getElementById('modalTitle').textContent = 'Confirmar Registro';
    } else {
        alert('Senha incorreta!');
        senhaInput.value = '';
        senhaInput.focus();
    }
});

// Event Listener para o botão cancelar da edição
document.getElementById('btnCancelarEdicao').addEventListener('click', function() {
    document.getElementById('editModal').classList.remove('active');
});

// Modificar o Event Listener do formulário principal
document.getElementById('combustivelForm').addEventListener('submit', function(e) {
    e.preventDefault();
    acaoAtual = 'registrar';

    const mogas = parseFloat(document.getElementById('mogas').value) || 0;
    
    // Verificar se há combustível suficiente apenas para MOGAS
    const totalUsado = calcularTotalCombustivelUsado();
    const disponivel = 3000 - totalUsado;
    
    if (mogas > disponivel) {
        alert('Quantidade insuficiente de MOGAS no reservatório para este abastecimento!');
        return;
    }

    dadosParaRegistro = {
        data: document.getElementById('data').value,
        horario: document.getElementById('horario').value,
        aeronave: document.getElementById('aeronave').value,
        mogas: document.getElementById('mogas').value,
        avgas: document.getElementById('avgas').value,
        responsavel: document.getElementById('responsavel').value
    };

    document.getElementById('modalTitle').textContent = 'Confirmar Registro';
    mostrarModalSenha();
});

// Event Listeners para as abas
document.addEventListener('DOMContentLoaded', function() {
    const abas = document.querySelectorAll('.aba-btn');
    
    abas.forEach(aba => {
        aba.addEventListener('click', function() {
            abas.forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            const mesSelecionado = this.dataset.mes;
            atualizarHistorico(mesSelecionado);
        });
    });

    // Inicializar o reservatório com base no histórico
    atualizarReservatorioComHistorico();
    
    // Inicializa com todos os dados
    atualizarHistorico('todos');

    // Download CSV
    document.getElementById('btnDownloadCSV').addEventListener('click', iniciarDownloadCSV);
    
    // Upload CSV
    document.getElementById('btnUploadCSV').addEventListener('click', iniciarUploadCSV);
    
    document.getElementById('fileUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                alert('Por favor, selecione um arquivo CSV válido.');
                return;
            }
            processarCSV(file);
            this.value = ''; // Limpa o input file
        }
    });
});

// Adicionar listener para a tecla Enter no campo de senha
senhaInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnConfirmar.click();
    }
});

// Função para converter dados para CSV
function converterParaCSV(dados) {
    if (dados.length === 0) return '';
    
    // Cabeçalho
    const headers = Object.keys(dados[0]);
    const csvRows = [headers.join(',')];
    
    // Dados
    for (const row of dados) {
        const values = headers.map(header => {
            const value = row[header];
            // Escapar aspas e vírgulas
            return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// Função para fazer download do CSV
function downloadCSV() {
    const dados = carregarDados();
    if (dados.length === 0) {
        alert('Não há dados para exportar!');
        return;
    }
    
    const csv = converterParaCSV(dados);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `backup_abastecimentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para processar arquivo CSV
function processarCSV(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const dados = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                const values = lines[i].split(',').map(v => 
                    v.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
                );
                
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                
                dados.push(row);
            }
            
            if (confirm('Isso irá substituir todos os dados existentes. Deseja continuar?')) {
                salvarDados(dados);
                atualizarHistorico();
                atualizarReservatorioComHistorico(); // Atualizar reservatório após importar CSV
                alert('Dados restaurados com sucesso!');
            }
        } catch (error) {
            alert('Erro ao processar o arquivo CSV. Verifique se o formato está correto.');
            console.error('Erro:', error);
        }
    };
    
    reader.readAsText(file);
}

// Event Listener para o botão cancelar do modal de senha
btnCancelar.addEventListener('click', function() {
    esconderModalSenha();
    document.getElementById('modalTitle').textContent = 'Confirmar Registro';
    // Limpar a ação atual
    acaoAtual = null;
    // Limpar dados temporários
    dadosParaRegistro = null;
    indiceEdicao = null;
});

// Variáveis para o reservatório
const btnGerenciarReservatorio = document.getElementById('btnGerenciarReservatorio');
const reservatorioModal = document.getElementById('reservatorioModal');
const btnConfirmarReservatorio = document.getElementById('btnConfirmarReservatorio');
const btnCancelarReservatorio = document.getElementById('btnCancelarReservatorio');
const nivelAtual = document.getElementById('nivel-atual');
const quantidadeDisponivelSpan = document.getElementById('quantidade-disponivel');

// Senha para gerenciar o reservatório
const SENHA_RESERVATORIO = '123456'; // Você pode alterar esta senha

// Inicializar o reservatório
let quantidadeDisponivel = localStorage.getItem('quantidadeReservatorio') || 0;
quantidadeDisponivel = parseFloat(quantidadeDisponivel);
atualizarExibicaoReservatorio();

// Abrir modal do reservatório
btnGerenciarReservatorio.addEventListener('click', () => {
    reservatorioModal.classList.add('active');
});

// Fechar modal do reservatório
btnCancelarReservatorio.addEventListener('click', () => {
    reservatorioModal.classList.remove('active');
    document.getElementById('quantidadeReservatorio').value = '';
    document.getElementById('senhaReservatorio').value = '';
});

// Confirmar operação no reservatório
btnConfirmarReservatorio.addEventListener('click', () => {
    const senha = document.getElementById('senhaReservatorio').value;
    const quantidade = parseFloat(document.getElementById('quantidadeReservatorio').value);
    const operacao = document.getElementById('operacaoReservatorio').value;

    if (!senha || !quantidade) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    if (senha !== SENHA_RESERVATORIO) {
        alert('Senha incorreta!');
        return;
    }

    let novaQuantidade = quantidadeDisponivel;
    const capacidadeTotal = 3000;

    switch (operacao) {
        case 'adicionar':
            if (quantidadeDisponivel + quantidade > capacidadeTotal) {
                alert('A quantidade excede a capacidade máxima de 3000L');
                return;
            }
            novaQuantidade = quantidadeDisponivel + quantidade;
            // Registrar adição manual no histórico
            registrarOperacaoManual('Adição', quantidade);
            break;
        case 'retirar':
            if (quantidade > quantidadeDisponivel) {
                alert('Quantidade insuficiente no reservatório');
                return;
            }
            novaQuantidade = quantidadeDisponivel - quantidade;
            // Registrar retirada manual no histórico
            registrarOperacaoManual('Retirada', quantidade);
            break;
        case 'definir':
            if (quantidade > capacidadeTotal) {
                alert('A quantidade excede a capacidade máxima de 3000L');
                return;
            }
            novaQuantidade = quantidade;
            // Registrar ajuste manual no histórico
            registrarOperacaoManual('Ajuste', quantidade);
            break;
    }

    quantidadeDisponivel = novaQuantidade;
    localStorage.setItem('quantidadeReservatorio', quantidadeDisponivel);
    atualizarExibicaoReservatorio();
    reservatorioModal.classList.remove('active');
    document.getElementById('quantidadeReservatorio').value = '';
    document.getElementById('senhaReservatorio').value = '';
});

// Função para registrar operações manuais no histórico
function registrarOperacaoManual(tipo, quantidade) {
    const dados = carregarDados();
    const operacaoManual = {
        data: new Date().toISOString().split('T')[0],
        horario: new Date().toTimeString().split(':').slice(0,2).join(':'),
        aeronave: 'OPERAÇÃO MANUAL',
        mogas: '0',
        avgas: '0',
        responsavel: 'Administrador',
        observacao: `${tipo} manual de ${quantidade}L no reservatório`
    };
    dados.push(operacaoManual);
    salvarDados(dados);
    atualizarHistorico();
}

// Função para atualizar a exibição do reservatório
function atualizarExibicaoReservatorio() {
    quantidadeDisponivelSpan.textContent = quantidadeDisponivel.toFixed(1);
    const percentual = (quantidadeDisponivel / 3000) * 100;
    nivelAtual.style.height = `${percentual}%`;
    
    // Mudar cor baseado no nível
    if (percentual <= 20) {
        nivelAtual.style.backgroundColor = '#dc3545'; // vermelho
    } else if (percentual <= 50) {
        nivelAtual.style.backgroundColor = '#ffc107'; // amarelo
    } else {
        nivelAtual.style.backgroundColor = '#4CAF50'; // verde
    }
}

// Função para calcular o total de combustível usado no histórico
function calcularTotalCombustivelUsado() {
    const dados = carregarDados();
    return dados.reduce((total, item) => {
        // Considera apenas MOGAS no cálculo
        return total + parseFloat(item.mogas || 0);
    }, 0);
}

// Função para atualizar o reservatório baseado no histórico
function atualizarReservatorioComHistorico() {
    const totalUsado = calcularTotalCombustivelUsado();
    const capacidadeTotal = 3000;
    quantidadeDisponivel = capacidadeTotal - totalUsado;
    
    // Garantir que a quantidade não fique negativa
    if (quantidadeDisponivel < 0) quantidadeDisponivel = 0;
    
    localStorage.setItem('quantidadeReservatorio', quantidadeDisponivel);
    atualizarExibicaoReservatorio();
} 
