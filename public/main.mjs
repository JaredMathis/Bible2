import axios from 'https://cdn.skypack.dev/axios';

export function main(parent) {
    let versions = [{
        label: 'Douay-Rheims Version, Challoner Revision',
        key: 'drv'
    }]
    let select = element(parent, 'select');
    versions.forEach(version => {
        let option = element(select, 'option');
        element_html_inner_set(option, version.label);
        element_attribute_set(option, version.key);
    })
}

export function element_attribute_set(element, attribute, value) {
    element.setAttribute(attribute, value);
}

export function element_html_inner_set(element, text) {
    element.innerHTML = text;
}

export function element(parent, tag_name) {
    let result = document.createElement(tag_name);
    parent.appendChild(result);
    return result;
}