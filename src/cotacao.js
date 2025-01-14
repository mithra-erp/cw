var identificador = null;
var currentCompany = null;

const container = document.querySelector("#grid");
const sendButton = document.querySelector('#sendButton');
const companySelector = document.querySelector("#filial");
const skuFilter = document.querySelector("#sku-filter");
const companies = [];

const __getFiliais = () => {
    let data = {
        "area": "EMPRES",
        "fields": [
            "CODIGO",
            "ALIAS",
            "LST_ATAK",
            "ENDERE",
            "FONE",
            "EMAIL",
            "FANTAS11"
        ],
        "search": [
            {
                "field": "CODATK",
                "operation": "DIFFERENT_THAN",
                "value": ""
            }
        ]
    }

    loading.start();

    fetch(Constants.PRODUCTION_URL + "/v1/search", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "X-Client-Id": sessionStorage.getItem('x-client-id'),
            "Authorization": "Bearer " + sessionStorage.getItem('access_token'),
            "Content-Type": "application/json"
        }
    }).then(response => {
        console.log(response)
        return response.json()
    }).then(json => {
        console.log(json)
        if (json.success) {
            json.data.forEach(item => {
                companies.push(item);
                document.querySelector("#filial").insertAdjacentHTML('beforeend', `<option value="${item.CODIGO}" data-lista="${item.LST_ATAK}">${item.ALIAS}</option>`);
            });
        } else {
            alert(json.message)
        }
    })
        .catch((error) => alert(error))
        .finally(() => loading.complete());
}

const __getItens = () => {
    console.log(companySelector.options[companySelector.selectedIndex].value)
    currentCompany = companies.find(item => item.CODIGO == companySelector.options[companySelector.selectedIndex].value);
    console.log(currentCompany);
    let data = {
        "area": "ITETAB A",
        "join": [
            {
                "area": "PRODUT P",
                "on": "P.CODIGO = A.PRODUTO"
            }
        ],
        "fields": [
            "P.CODIGO",
            "P.DESCRICAO",
            "A.PRECO"
        ],
        "search": [
            {
                "field": "A.CHAVE",
                "operation": "EQUAL_TO",
                "value": companySelector.value
            }
        ]
    }

    loading.start();

    fetch(Constants.PRODUCTION_URL + "/v1/search", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "X-Client-Id": sessionStorage.getItem('x-client-id'),
            "Authorization": "Bearer " + sessionStorage.getItem('access_token'),
            "Content-Type": "application/json"
        }
    }).then(response => {
        console.log(response)
        return response.json()
    }).then(json => {
        container.innerHTML = '';
        if (json.success) {

            identificador = json.data[0].IDENTIFICADOR;

            json.data.forEach(item => {
                let card = document.createElement('div');
                card.classList.add('card');
                card.classList.add('p-2')
                card.classList.add('mt-2')
                card.setAttribute('data-description', item.DESCRICAO);

                let row = document.createElement('div');
                row.classList.add('row');

                let col1 = document.createElement('div');
                col1.classList.add('col')
                col1.classList.add('fw-bold')
                col1.innerHTML = item.DESCRICAO;
                row.appendChild(col1);
                card.appendChild(row);

                row = document.createElement('div');
                row.classList.add('row');
                row.classList.add('sku');
                row.setAttribute('data-code', item.CODIGO);

                row.insertAdjacentHTML('beforeend', `<div class='col'><label>Preço</label><input class="form-control preco" type="number" placeholder="Default input" aria-label="default input example" value='${item.PRECO.trim()}' disabled readonly></div>`);

                row.insertAdjacentHTML('beforeend', `<div class='col'><label>Quantidade</label><input class="form-control quantidade" type="number" onkeyup="__updateTotalItem(this)" placeholder="Default input" aria-label="default input example" value='0.000'></div>`);

                row.insertAdjacentHTML('beforeend', `<div class='col'><label>Total</label><input class="form-control total" type="number" placeholder="Default input" aria-label="default input example" value='0.00' disabled readonly></div>`);


                card.appendChild(row);
                container.appendChild(card);
            });
            sendButton.classList.remove('d-none');
        } else {
            alert(json.message)
        }
    }).catch((error) => alert(error))
        .finally(() => {
            updateBill();
            loading.complete();
        });
}

const __updateTotalItem = (item) => {
    let parent = item.parentElement.parentElement;
    parent.getElementsByClassName('total')[0].value = (parseFloat(item.value) * parseFloat(parent.getElementsByClassName('preco')[0].value)).toFixed(2);
    updateBill();
}

const __filter = () => {
    let filter = skuFilter.value.toLowerCase();
    let cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (card.getAttribute('data-description').toLowerCase().indexOf(filter) > -1) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

const __save = () => {
    if (companySelector.value == '') return;

    if (identificador == null || identificador == '') {
        identificador = uuidv4();
    }

    let currentDate = new Date().toJSON().slice(0, 10).replaceAll('-', '');
    let data = [];
    document.querySelectorAll(".sku").forEach(item => {
        data.push({
            FILIAL: companySelector.value,
            DATA: currentDate,
            CODIGO: item.getAttribute('data-code'),
            PEDIDO: item.querySelector('.pedido').value,
            MINIMO: item.querySelector('.minimo').value,
            SUGESTAO: item.querySelector('.sugestao').value,
            SALDO: item.querySelector('.saldo').value,
            STATUS: "FINALI",
            IDENTIFICADOR: identificador
        });
    })

    loading.start();

    let json = [{ area: 'ESTLOJ', data: data }, { area: 'LOGATAK', data: [{ DATA: now.date(), HORA: now.time(), RETORNO: "Aguardando Transmissão", IDENTIFICADOR: identificador }] }];

    fetch(Constants.PRODUCTION_URL + "/v1/template", {
        method: "PUT",
        body: JSON.stringify(json),
        headers: {
            "X-Client-Id": sessionStorage.getItem('x-client-id'),
            "Authorization": "Bearer " + sessionStorage.getItem('access_token'),
            "Content-Type": "application/json"
        }
    })
        .then(response => {
            console.log(response)
            return response.json()
        })
        .then(json => {
            console.log(json);
            if (json.success) {
                alert('Pedido salvo!')
                history.back();
            } else {
                alert(json.message);
            }
        })
        .catch((error) => alert(error))
        .finally(() => loading.complete());
}


const updateBill = () => {
    var totalKG = 0;
    var totalCX = 0;
    const items = document.querySelectorAll(".card");
    for (const item of items) {
        const quantidade =  item.getElementsByClassName('quantidade')[0].value;
        const total = item.getElementsByClassName('total')[0].value;
        totalKG += parseFloat(quantidade);
        totalCX += parseFloat(total);
    }

    document.querySelector(".volume-total").value = totalKG.toFixed(3);
    document.querySelector(".valor-total").value = totalCX.toFixed(2);
}

sendButton.addEventListener('click', () => {
    confirmation.show('Salvar pedido?', 'Confirmação', () => {
        __save();
    });
});
companySelector.addEventListener('change', () => __getItens());
skuFilter.addEventListener('keyup', () =>  __filter());

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});


const __main = () => __getFiliais();


const gerarPdf = () => {
    var doc = new jsPDF()
    doc.setFontSize(9);
    
    const items = document.querySelectorAll(".card");
    let linha = 10;
    let totalGeral = 0;
    let quantidadeGeral = 0;

    doc.setFontSize(9);
    
    console.log(currentCompany)
    // Dados da empresa
    const empresa = {
        nome: currentCompany.FANTAS11,
        endereco: currentCompany.ENDERE,
        telefone: currentCompany.FONE,
        email: currentCompany.EMAIL,
        logo: "data:image/png;base64,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" // Substitua pelo seu base64
    };

    doc.addImage(empresa.logo, 'PNG', 5, 10, 40, 20); // Ajuste as coordenadas e o tamanho conforme necessário

    
    doc.text(new Date().toLocaleDateString(), 200, linha, {align: 'right'});

    // Cabeçalho da empresa
    doc.setFontType("bold");
    doc.text(empresa.nome, 60, linha);
    linha += 5;
    doc.setFontType("normal");
    doc.text(empresa.endereco, 60, linha);
    linha += 5;
    doc.text(`Telefone: ${empresa.telefone}`, 60, linha);
    linha += 5;
    doc.text(`Email: ${empresa.email}`, 60, linha);

    linha += 10;
    
    linha += 5;
    
    doc.setFontType("bold");

    doc.setFontSize(12);
    doc.text("Cotação de Preços", 100, linha, {align: 'center'});

    doc.setFontSize(9);
    linha += 5;
    linha += 5;

    doc.text("PRODUTO", 10, linha);
    doc.text("PREÇO", 100, linha, {align: 'right'});
    doc.text("QUANT.", 150, linha, {align: 'right'});
    doc.text("TOTAL", 200, linha, {align: 'right'});
    doc.line(10, linha + 1, 200, linha + 1);
    doc.setFontType("normal");

    for (const item of items) {
        const description =  item.getAttribute('data-description');
        const preco =  item.getElementsByClassName('preco')[0].value;
        const quantidade =  item.getElementsByClassName('quantidade')[0].value;
        const total = item.getElementsByClassName('total')[0].value;
        
        if (total > 0) {
            linha += 5;
            doc.text(description, 10, linha);
            doc.text(parseFloat(preco).toLocaleString('pt-br', {minimumFractionDigits: 2}), 100, linha, {align: 'right'});
            doc.text(parseFloat(quantidade).toLocaleString('pt-br', {minimumFractionDigits: 3}), 150, linha, {align: 'right'});
            doc.text(parseFloat(total).toLocaleString('pt-br', {minimumFractionDigits: 2}), 200, linha, {align: 'right'});

            totalGeral += parseFloat(total);
            quantidadeGeral += parseFloat(quantidade);
        }
    }

    doc.line(10, linha + 1, 200, linha + 1);
    linha += 5;

    doc.setFontType("bold");
    
    doc.text(quantidadeGeral.toLocaleString('pt-br', {minimumFractionDigits: 3}), 150, linha, {align: 'right'});
    doc.text(totalGeral.toLocaleString('pt-br', {minimumFractionDigits: 2}), 200, linha, {align: 'right'});
    linha += 10;

    const fileHandle = new File([doc.output('blob')], "hello.pdf", { type: "application/pdf" });
    share(fileHandle)
}
async function share(fileHandle) {
    // Usando o navigator.share() para compartilhar o arquivo
    try {
        // Verificando se o navegador suporta compartilhamento de arquivos
        if (navigator.canShare && navigator.canShare({ files: [fileHandle] })) {
            // Iniciando o compartilhamento
            await navigator.share({
                files: [fileHandle], // Arquivo a ser compartilhado
                title: 'Arquivo Exemplo', // Título do compartilhamento
                text: 'Veja o arquivo que estou compartilhando com você!', // Texto adicional
            });
        } else {
            console.log("Compartilhamento não suportado para este tipo de arquivo.");
        }
    } catch (error) {
        console.error('Erro ao compartilhar:', error);
    }
}