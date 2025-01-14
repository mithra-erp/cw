const modalString = '' +
    '<div class="modal" id="exampleModal" tabindex="-1">' +
    '  <div class="modal-dialog modal-dialog-centered">' +
    '    <div class="modal-content">' +
    '      <div class="modal-header">' +
    '        <h5 class="modal-title">Modal title</h5>' +
    '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
    '      </div>' +
    '      <div class="modal-body">' +
    '        <p>Modal body text goes here.</p>' +
    '      </div>' +
    '      <div class="modal-footer">' +
    '        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="confirm-cancel">Cancelar</button>' +
    '        <button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="confirm-ok">Salvar</button>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>';

const modalButton = '' +
    '<button type="button" class="btn btn-primary d-none" data-bs-toggle="modal" data-bs-target="#exampleModal">' +
    '  Launch demo modal' +
    '</button>';

const button = createElementFromHTML(modalButton);
const modal = createElementFromHTML(modalString);

modal.addEventListener('hidden.bs.modal', () => {
    document.body.removeChild(button);
    document.body.removeChild(modal);
})

const confirmation = {
    show: function (message, title, action) {
        modal.querySelector('#confirm-ok').onclick = () => {
            action();
        };
        modal.querySelector('.modal-title').innerHTML = title;
        modal.querySelector('.modal-body p').innerHTML = message;
        document.body.appendChild(button);
        document.body.appendChild(modal);
        button.click();
    },
    complete: function () {
        var loading = document.getElementById("loading");
        loading.remove(loading);
    }
};

document.addEventListener('click', (e) => {
    const element = e.relatedTarget || e.target;
    if (element.id == 'confirm-ok') {
        console.log(element);
    }
})