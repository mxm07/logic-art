const sizelabel = document.getElementById("sizelabel");
const sizeslider = document.getElementById("sizeslider");
const inputelem = document.getElementById("input");
const submitbutton = document.getElementById("submit");
const valuedisplay = document.getElementById("value_display");
const colorPicker1 = document.getElementById("color1");
const colorPicker2 = document.getElementById("color2");
const outputbtn_png = document.getElementById("outputbtn_png");
const outputbtn_jpg = document.getElementById("outputbtn_jpg");
const ppcslider = document.getElementById("ppcslider");
const ppclabel = document.getElementById("ppclabel");

 
const cvs = document.getElementById("canvas");
const ctx = cvs.getContext('2d'); 

const validOperators = ["~", "!", "|", "&", "^"];

const canvas_size = 800;

let size = 3;
let computed_size = 8;

let labels = [];
let values = [];

let colors = ["#fff", "#000"];





sizeslider.addEventListener("input", function() {
    size = sizeslider.value;
    sizelabel.innerHTML = size;
});

submitbutton.addEventListener("click", () => {
    valuedisplay.innerHTML = "";

    if (size >= 7) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        ctx.fillStyle = "#000";
        ctx.font = "1em sans-serif";
        ctx.textAlign="center";
        ctx.fillText("loading", cvs.width/2, cvs.height/2);

        setTimeout(updateCanvas, 250);
    } else updateCanvas();
});


// Display cell value on mouse move
cvs.addEventListener("mousemove", (e) => {
    const mousePos = (canvas, evt) => {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };
    
    const pos = mousePos(cvs, e);
    if (labels.length < computed_size) return;

    const i = Math.max(Math.floor(pos.x / (cvs.width / computed_size)), 0);
    const j = Math.max(Math.floor(pos.y / (cvs.height / computed_size)), 0);

    valuedisplay.innerHTML = `${i}x${j}: ${labels[i][j]}`;
})
 
colorPicker1.addEventListener("input", () => { colors[0] = colorPicker1.value; localStorage.setItem("color1", colorPicker1.value); }, false);
colorPicker2.addEventListener("input", () => { colors[1] = colorPicker2.value; localStorage.setItem("color2", colorPicker2.value); }, false);


/*
    Load any saved color configurations from local storage on page load
*/
window.onload = () => { 
    const c1 = localStorage.getItem("color1");
    const c2 = localStorage.getItem("color2");

    if (c1) {
        colorPicker1.value = c1;
        colors[0] = c1;
    } else colorPicker1.value = colors[0];

    if (c2) {
        colorPicker2.value = c2;
        colors[1] = c2;
    } else colorPicker2.value = colors[1];
}



/*
    Update canvas with new values
*/
const updateCanvas = () => {
    cvs.width = canvas_size;
    cvs.height = canvas_size;

    values = [];
    labels = [];
    computed_size = Math.pow(2, size);

    

    if (inputelem.value.length === 0) return; //No input 

    const data = to_postfix(inputelem.value);
    order = data[0].length;

    if (order <= 1) return; //Only one (or 0) variable, cannot be displayed


    const pf = data[1];
    const combos = combinations(size);
    computed_size = combos.length;

    for (let i = 0; i < computed_size; i++) {
        values.push([]);
        labels.push([]);

        const cur = combos[i];
        for (let j = 0; j < computed_size; j++) {
            values[i].push([]);
            labels[i].push([]);

            let cur_values = [];
            let str = "";

            for (let item of combos[j]) {
                cur_values.push(cur.indexOf(item) > -1 ? 1 : 0)
                str += item + ": " + cur_values[cur_values.length-1] + "   ";
            }

            if ("".indexOf(cur) > -1) values[i][j] = 0;
            else values[i][j] = eval_expr(pf, cur_values);
            labels[i][j] = str + " : " + "value: " + values[i][j];
        }
    }
    const rsize = canvas_size / computed_size;
    if (values.length !== computed_size) return;

    cvs.style.backgroundColor = colors[0];
    ctx.fillStyle = colors[1];

    for (let i = 0; i < computed_size; i++) {
        for (let j = 0; j < computed_size; j++) {
            if (!values[i][j] || values[i][j] === 0) continue
            //ctx.fillStyle = !values[i][j] || values[i][j] === 0 ? colors[0] : colors[1];
            ctx.fillRect(i * rsize, j * rsize, rsize, rsize);
        }
    }
};



/*
    Convert a logical expression into postfix by Shunting-Yard
*/
const to_postfix = (expr) => {
    tokens = expr.replace(/\s+/g, '').split('');

    queue = [];
    stack = [];
    letters = [];

    while (tokens.length > 0) {
        const token = tokens.shift();

        if (/!?[a-zA-Z0-9]/.test(token)) {
            letters.push(token);
            queue.push(token);
        } else if (validOperators.indexOf(token) > -1) {
            while (stack.length > 0 && stack[stack.length-1] != "(")
                queue.push(stack.pop());

            stack.push(token);
        } else if (token == "(") stack.push("(");
        else if (token == ")") {
            while (stack[stack.length-1] != "(")
                queue.push(stack.pop());

            stack.pop();
        }
        
    }

    while (stack.length > 0) queue.push(stack.pop());

    return [letters, queue];
};


/*
    Evaluate a postfix expression with an array of values
    Evaluates the expression, inserting the values in order wherever a variable is encountered
    If the array of values is not large enough, zeroes are used
    If the array of values is too large, evaluate the expression again with the result of evaluating the first expression inserted into the values array
*/
const eval_expr = (postfix, values) => {
    let stack = [];

    if (postfix.length == 1) return 1;

    const eval = (r1, r2, o) => {
        if (typeof r1 !== "number" || typeof r2 !== "number") return;

        if (r1 > 1) r1 = 1;
        if (r2 > 1) r2 = 1;
        if (r1 < 0) r1 = 0;
        if (r2 < 0) r2 = 0;

        switch (o) {
            case "&":
                return r1 & r2;
            case "|":
                return r1 | r2;
            case "^":
                return r1 ^ r2;
        }

        return 0;
    };

    if (values.length == 1)
        return eval_expr(postfix, [values[0], 0]);
    
    let valuemap = {};
    for (let token of postfix) {
        if (validOperators.indexOf(token) > -1) {
            if (token === '~' || token === '!') {
                let r = stack.pop();
                if (!parseInt(r)) {
                    const s = (values.length > 0 ? values.shift() : 0) === 0 ? 1 : 0;

                    if (r in valuemap) r = valuemap[r];
                    else { valuemap[r] = s; r = s; }
                }
                stack.push(r);
            } else {
                let r1 = stack.pop();
                let r2 = stack.pop();

                if (isNaN(parseInt(r1))) { 
                    const s = values.length > 0 ? values.shift() : 0;
    
                    if (r1 in valuemap) r1 = valuemap[r1];
                    else { valuemap[r1] = s; r1 = s; }
                } else r1 = parseInt(r1);

                if (isNaN(parseInt(r2))) {
                    const s = values.length > 0 ? values.shift() : 0;
                    
                    if (r2 in valuemap) r2 = valuemap[r2];
                    else { valuemap[r2] = s; r2 = s; }
                } else r2 = parseInt(r2);
                
                const res = eval(r1, r2, token);
                stack.push(res);
            }
        } else if (/!?[a-zA-Z0-9]/.test(token))
            stack.push(token);
        else continue;
    }

    if (values.length == 0) return stack.pop();
    else return eval_expr(postfix, [stack.pop()].concat(values));
};


const output_img = (ppc, type) => {
    if (values.length !== computed_size) return;

    const new_cvs = document.createElement('canvas');
    document.body.appendChild(new_cvs);


    new_cvs.style.width = computed_size * ppc;
    new_cvs.style.height = computed_size * ppc;
    new_cvs.width = computed_size * ppc;
    new_cvs.height = computed_size * ppc;

    const new_ctx = new_cvs.getContext('2d');

    new_cvs.style.backgroundColor = colors[0];
    new_ctx.fillStyle = colors[1];

    for (let i = 0; i < computed_size; i++) {
        for (let j = 0; j < computed_size; j++) {
            if (!values[i][j] || values[i][j] === 0) continue
            //ctx.fillStyle = !values[i][j] || values[i][j] === 0 ? colors[0] : colors[1];
            new_ctx.fillRect(i * ppc, j * ppc, ppc, ppc);
        }
    }

    const img = new_cvs.toDataURL(`image/${type}`);

    //Credit https://stackoverflow.com/a/5100158
    const dataURItoBlob = (dataURI) => {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);
    
        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    
        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
    
        return new Blob([ia], {type:mimeString});
    };

    window.location = window.URL.createObjectURL(dataURItoBlob(img));
    document.body.removeChild(new_cvs);
}

outputbtn_png.addEventListener('click', (e) => { output_img(ppcslider.value || 1, 'png'); });
outputbtn_jpg.addEventListener('click', (e) => { output_img(ppcslider.value || 1, 'jpg'); });


ppcslider.addEventListener("input", () => { ppclabel.innerHTML = ppcslider.value; });




/*
    Helper functions
*/

const unique = (a) => { return a.sort().filter((item, pos, ary) => { return !pos || item != ary[pos - 1]; }); };

// Get all permutations of letters up to index "limit" in order
// e.g. combinations(3) -> [['A'], ['B'], ['A', 'B'], ['C'], ['A', 'C'], ['B', 'C'], ['A','B','C']]
const letter_list = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const combinations = (limit) => {
    const bound = Math.pow(2, limit);
    let skip = 1;
    let out = [""];

    for (let i = 0; i < limit; i++) {
        for (let j = skip; j < bound; j += skip * 2) {
            for (let k = j; k < j + skip; k++) {
                if (!out[k]) out[k] = "";
                out[k] += letter_list[i];
            }
        }
        skip *= 2;
    }

    return out.map((it) => it.split(""));
}