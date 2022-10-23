var express = require('express');
var router = express.Router();
var empresasModel = require('./../../models/empresasAsociadasModel');
var util = require('util');
var cloudinary = require('cloudinary').v2;

const uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);

router.get('/', async function(req, res, next) {
    var empresas = await empresasModel.getempresasAsociadass();

    empresas = empresas.map(empresas => {
        if(empresas.img_id){
            const imagen = cloudinary.image(empresas.img_id, {
                width: 100,
                height: 100,
                crop: "fill"
            });
            return {...empresas, imagen};
        }
        else {
            return {...empresas, imagen: ''};
        }
    });

    res.render('admin/EmpresasAsociadas/empresasIndex',{
        layout: 'admin/layout',
        usuario: req.session.nombre,
        empresas
    });
});

router.get('/eliminar/:Id', async(req, res, next) => {
    var Id = req.params.Id;
    let empresas = await empresasModel.getempresasAsociadasById(Id);
    if(empresas.img_id){
        await destroy(empresas.img_id);
    }
    await empresasModel.deleteempresasAsociadasById(Id);
    res.redirect('/admin/empresasAsociadas');
});

router.get('/agregar', (req, res, next) => {
    res.render('admin/EmpresasAsociadas/agregarEmpresa',{
        layout: 'admin/layout',
    });
});

router.post('/agregar', async(req, res, next) => {
    try{
        var img_id = '';
        if (req.files && Object.keys(req.files).length > 0){
            imagen = req.files.imagen;
            img_id = (await uploader(imagen.tempFilePath)).public_id;
        }
        if (req.body.NombreEmpresa != "" && req.body.DescripcionEmpresa != "") {
            await empresasModel.insertempresasAsociadas({...req.body, img_id});
            res.redirect('/admin/novedades');
        }
    }
    catch (error) {
        console.log(error);
        res.render('admin/EmpresasAsocias/agregarEmpresa',{
            layout: 'admin/layout',
            error: true,
            mensaje: 'Ocurrió un error'
            });
    }
});

router.get('/modificar/:Id', async(req, res, next) => {
    let Id = req.params.Id;
    let empresa = await empresasModel.getempresasAsociadasById(Id);
    res.render('admin/EmpresasAsociadas/editarEmpresa',{
        layout: 'admin/layout',
        empresa
    });
});

router.post('/modificar', async(req, res, next) => {
    try{
        let img_id = req.body.img_original;
        let borrar_img_vieja = false;
        if(req.body.img_delete === 1){
            img_id = null;
            borrar_img_vieja = true;
        }
        else{
            if (req.files && Object.keys(req.files).length > 0){
                imagen = req.files.imagen;
                img_id = (await uploader(imagen.tempFilePath)).public_id;
                borrar_img_vieja = true;
            }
        }
        if(borrar_img_vieja && req.body.img_original){
            await destroy(req.body.img_original);
        }

        var Id = req.body.Id;
        var empresa = {
            NombreEmpresa: req.body.NombreEmpresa,
            DescripcionEmpresa: req.body.DescripcionEmpresa,
            img_id
        }
        await empresasModel.updateempresasAsociadasById(Id, empresa);
        res.redirect('/admin/empresasAsociadas');
    }
    catch (error) {
        console.log(error);
        res.render('admin/EmpresasAsociadas/editarEmpresa',{
            layout: 'admin/layout',
            error: true,
            mensaje: 'Ocurrió un error'
            });
    }
});

module.exports = router;