var fixed_spheres = [
    {   //b0
        center: [ 0, 0, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b1
        center: [ 0.4, 0, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b2
        center: [ -0.4, 0, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    ///
    {   //b3
        center: [ -0.2, 0.35, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b4
        center: [ 0.2, 0.35, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    ///
    {   //b5
        center: [ 0.0, 0.7, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    ///
    {   //b6
        center: [ 0.2, -0.35, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b7
        center: [ -0.2, -0.35, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b8
        center: [ -0.6, -0.35, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b9
        center: [ 0.6, -0.35, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    ///
    {   //b10
        center: [ 0, -0.7, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b11
        center: [ 0.4, -0.7, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b12
        center: [ 0.8, -0.7, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b13
        center: [ -0.4, -0.7, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //b14
        center: [ -0.8, -0.7, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ Math.random(), Math.random(), Math.random() ],
            k_s: [ 0.8, 0.8, 0.8 ],
            n: 100
        }
    },
    {   //white
        center: [ 0, 4, 0 ],
        radius: 0.2,
        mtl: {
            k_d: [ 1.0, 1.0, 1.0 ],          
            k_s: [ 0.2, 0.2, 0.2 ],
            n: 100
        }
    }
];

var lights = [
    {
        position:  [ 0, 0, 10 ],
        intensity: [ 1, 1, 1 ]
    }
];

var holes=Array(6);
holes[0]=new Vec3(-3.0,0.0,0.0);
holes[1]=new Vec3(3.0,0.0,0.0);
holes[2]=new Vec3(-3.0,5.55,0.0);
holes[3]=new Vec3(3.0,5.55,0.0);
holes[4]=new Vec3(-3.0,-5.55,0.0);
holes[5]=new Vec3(3.0,-5.55,0.0);