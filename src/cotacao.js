window.__b64Cache = window.__b64Cache || {};
// Armazena arquivos na memória (id -> File)
const __files = new Map();

var identificador = null;
var currentCompany = null;

const container = document.querySelector("#grid");
const companySelector = document.querySelector("#filial");
const skuFilter = document.querySelector("#sku-filter");
const checkCotados = document.querySelector("#checkbox-cotados");
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

                row.insertAdjacentHTML('beforeend', `<div class='col'><label>Quantidade</label><input class="form-control quantidade" type="number"  onfocus="setTimeout(() => this.select(), 0)" inputmode="decimal" onkeyup="__updateTotalItem(this)" placeholder="Default input" aria-label="default input example" value='0.000'></div>`);

                row.insertAdjacentHTML('beforeend', `<div class='col'><label>Total</label><input class="form-control total" type="number" placeholder="Default input" aria-label="default input example" value='0.00' disabled readonly></div>`);


                card.appendChild(row);
                container.appendChild(card);
            });

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
        if (checkCotados.checked) {
            let quantidade = card.querySelector('.quantidade').value;
            if (quantidade == '' || parseFloat(quantidade) <= 0) {
                card.style.display = 'none';
                return;
            }
        }
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
        const quantidade = item.getElementsByClassName('quantidade')[0].value;
        const total = item.getElementsByClassName('total')[0].value;
        totalKG += parseFloat(quantidade);
        totalCX += parseFloat(total);
    }

    document.querySelector(".volume-total").value = totalKG.toFixed(3);
    document.querySelector(".valor-total").value = totalCX.toFixed(2);
}

checkCotados.addEventListener('change', () => __filter());
companySelector.addEventListener('change', () => __getItens());
skuFilter.addEventListener('keyup', () => __filter());

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});


const __main = () => __getFiliais();


const gerarPdf = () => {
    var doc = new jsPDF()
    doc.setFontSize(9);

    const items = document.querySelectorAll(".card");
    let linha = 15;
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
        logo: "data:image/png;base64,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"
    };

    doc.addImage(empresa.logo, 'PNG', 5, 5, 40, 30); // Ajuste as coordenadas e o tamanho conforme necessário


    doc.text(new Date().toLocaleDateString(), 200, linha, { align: 'right' });

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
    doc.text("Cotação de Preços", 100, linha, { align: 'center' });

    doc.setFontSize(9);
    linha += 5;
    linha += 5;

    doc.text("PRODUTO", 10, linha);
    doc.text("PREÇO", 100, linha, { align: 'right' });
    doc.text("QUANT.", 150, linha, { align: 'right' });
    doc.text("TOTAL", 200, linha, { align: 'right' });
    doc.line(10, linha + 1, 200, linha + 1);
    doc.setFontType("normal");

    for (const item of items) {
        const description = item.getAttribute('data-description');
        const preco = item.getElementsByClassName('preco')[0].value;
        const quantidade = item.getElementsByClassName('quantidade')[0].value;
        const total = item.getElementsByClassName('total')[0].value;

        if (total > 0) {
            linha += 5;
            doc.text(description, 10, linha);
            doc.text(parseFloat(preco).toLocaleString('pt-br', { minimumFractionDigits: 2 }), 100, linha, { align: 'right' });
            doc.text(parseFloat(quantidade).toLocaleString('pt-br', { minimumFractionDigits: 3 }), 150, linha, { align: 'right' });
            doc.text(parseFloat(total).toLocaleString('pt-br', { minimumFractionDigits: 2 }), 200, linha, { align: 'right' });

            totalGeral += parseFloat(total);
            quantidadeGeral += parseFloat(quantidade);
        }
    }

    doc.line(10, linha + 1, 200, linha + 1);
    linha += 5;

    doc.setFontType("bold");


    doc.text(quantidadeGeral.toLocaleString('pt-br', { minimumFractionDigits: 3 }), 150, linha, { align: 'right' });
    doc.text(totalGeral.toLocaleString('pt-br', { minimumFractionDigits: 2 }), 200, linha, { align: 'right' });
    linha += 10;


    doc.text("PROPOSTA VALIDA PARA A DATA DA COTAÇÃO", 10, linha);

    const fileHandle = new File([doc.output('blob')], "cotacao.pdf", { type: "application/pdf" });
    // share(fileHandle)
    share({ title: 'Cotação de Preços', text: 'Segue cotação.', file: fileHandle });
}
async function share(file) {
    // Usando o navigator.share() para compartilhar o arquivo
    try {
        // Verificando se o navegador suporta compartilhamento de arquivos
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            // Iniciando o compartilhamento
            await navigator.share({
                files: [file], // Arquivo a ser compartilhado
                title: 'Cotação de Preços', // Título do compartilhamento
                text: 'Segue cotação.', // Texto adicional
            });
        } else {
            await shareBlob(file, file.name, file.type)
            // console.log("Compartilhamento não suportado para este tipo de arquivo.");

        }
    } catch (error) {
        console.error('Erro ao compartilhar:', error);
    }
}
// Função para acionar o compartilhamento via app
function shareViaApp({ title, text, url, file } = {}) {
    // Se tem navigator.share e não precisa de arquivo, usa direto
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ title, text, url });
    }

    const payload = { title, text, url };
    if (file) {
        payload.fileId = __registerFileB64(file);
        payload.fileName = file.name || 'arquivo.bin';
        payload.mime = file.type || 'application/octet-stream';
    }

    const json = encodeURIComponent(JSON.stringify(payload));
    window.location.href = 'appshare://' + json; // será interceptado no C#
    return Promise.resolve();
}

// Exemplo: ler input file e acionar share
async function onPickAndShare(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await shareViaApp({ title: 'Compartilhar arquivo', file });
}


function __registerFileB64(file) {
    const id = (crypto?.randomUUID?.() || (Date.now() + Math.random().toString(16).slice(2)));
    const r = new FileReader();
    r.onload = () => {
        const dataUrl = String(r.result || "");
        window.__b64Cache[id] = dataUrl.split(",")[1] || "";
    };
    r.readAsDataURL(file); // async, mas preenche o cache sozinho
    return id;
}
// pegar depois (sincrônico)
function app_getFileBase64(id) {
    return (window.__b64Cache && window.__b64Cache[id]) || null;
}


function __registerFile(file) {
    const id = (crypto?.randomUUID?.() ?? (Date.now() + Math.random().toString(16).slice(2)));
    __files.set(id, file);
    return id;
}

// prepara metadados p/ chunking
function app_prepareFileChunks(id, chunkSize = 262144) { // 256 KB
    const file = __files.get(id);
    if (!file) return null;
    return JSON.stringify({
        total: Math.ceil(file.size / chunkSize),
        size: file.size,
        name: file.name || "arquivo.bin",
        mime: file.type || "application/octet-stream",
        chunkSize
    });
}

// retorna 1 chunk em base64 (SEM prefixo data:)
async function app_getFileChunk(id, index, chunkSize) {
    const file = __files.get(id);
    if (!file) return null;
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);
    const buf = await blob.arrayBuffer();

    // Uint8Array -> base64
    let binary = "";
    const bytes = new Uint8Array(buf);
    const len = bytes.length;
    const block = 0x8000; // evitar call stack gigante
    for (let i = 0; i < len; i += block) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + block, len)));
    }
    return btoa(binary);
}

// Converte Blob em chunks base64 e envia via AndroidShare
async function shareBlob(blob, fileName, mime, title = 'Compartilhar') {
    if (!blob) { alert('Blob vazio'); return; }

    // iOS/mac (fora do escopo aqui): se quiser, teste navigator.share e use lá.

    if (!window.AndroidShare || !AndroidShare.begin) {
        alert('AndroidShare indisponível no WebView.');
        return;
    }

    const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    fileName = fileName || 'arquivo.bin';
    mime = mime || blob.type || 'application/octet-stream';

    AndroidShare.begin(id, fileName, mime);

    const chunkSize = 262144; // 256 KB
    for (let off = 0; off < blob.size; off += chunkSize) {
        const piece = blob.slice(off, off + chunkSize);
        const buf = await piece.arrayBuffer();
        const bytes = new Uint8Array(buf);

        // Uint8 -> base64 sem estourar call stack
        let binary = '';
        const block = 0x8000;
        for (let i = 0; i < bytes.length; i += block) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + block, bytes.length)));
        }
        const b64 = btoa(binary);

        AndroidShare.append(id, b64);
    }

    AndroidShare.end(id, title);
}