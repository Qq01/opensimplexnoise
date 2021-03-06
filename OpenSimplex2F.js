import { Grad2, Grad3, Grad4 } from './utils/Grad.js';
import { LatticePoint2D, LatticePoint3D, LatticePoint4D } from './utils/LatticePoint.js';
/**
 * Rewrite of https://github.com/KdotJPG/OpenSimplex2 in javascript.
 */
export class OpenSimplex2F {
    static _PSIZE = 2048;
    static _PMASK = 2047;

    /**
     * @type {number[]}
     */
    _perm = new Array(OpenSimplex2F._PSIZE);
    /**
     * @type {Grad2[]}
     */
    _permGrad2 = new Array(OpenSimplex2F._PSIZE);
    /**
     * @type {Grad3[]}
     */
    _permGrad3 = new Array(OpenSimplex2F._PSIZE);
    /**
     * @type {Grad4[]}
     */
    _permGrad4 = new Array(OpenSimplex2F._PSIZE);

    /**
     * 
     * @param seed {number}
     */
    constructor(seed) {
        seed = (seed * 6364136223846793005) + 1442695040888963407;
        /**
         * @type {number[]}
         */
        const source = (new Array(OpenSimplex2F._PSIZE)).fill(0).map((_v, i) => {return i});
        for (let i = OpenSimplex2F._PSIZE - 1; i >= 0; i--) {
            let r = Math.round((seed + 31) % (i + 1));
            if (r < 0) r += (i + 1);
            this._perm[i] = source[i];
            this._permGrad2[i] = OpenSimplex2F._GRADIENTS_2D[this._perm[i]];
            this._permGrad3[i] = OpenSimplex2F._GRADIENTS_3D[this._perm[i]];
            this._permGrad4[i] = OpenSimplex2F._GRADIENTS_4D[this._perm[i]];
            source[r] = source[i];
        }
    }

    /**
     * 
     * @param xs {number}
     * @param ys {number}
     */
    _noise2_Base(xs, ys) {
        let value = 0;
        const xsb = Math.floor(xs);
        const ysb = Math.floor(ys);
        const xsi = xs - xsb;
        const ysi = ys - ysb;

        const index = Math.round((ysi - xsi) / 2) + 1;

        const ssi = (xsi - ysi) * -0.211324865405187;
        const xi = xsi + ssi;
        const yi = ysi + ssi;
        for (let i = 0; i < 3; i++) {
            const c = OpenSimplex2F._LOOKUP_2D[index + i];
            const dx = xi + c.dx;
            const dy = yi + c.dy;
            let attn = 0.5 - dx * dx - dy * dy;
            if (attn <= 0) continue;

            const pxm = (xsb + c.xsv) & OpenSimplex2F._PMASK;
            const pym = (ysb + c.ysv) & OpenSimplex2F._PMASK;
            const grad = this._permGrad2[this._perm[pxm] ^ pym];
            const extrapolation = grad.dx * dx + grad.dy * dy;

            attn *= attn;
            value += attn * attn * extrapolation;
        }
        return value;
    }

    /**
     * 
     * @param x {number}
     * @param y {number}
     */
    Noise(x, y) {
        const s = 0.366025403784439 * (x + y);
        const xs = x + s;
        const ys = y + s;

        return this._noise2_Base(xs, ys);
    }
    /**
     * 
     * @param x {number}
     * @param y {number}
     */
    Noise2_XBeforeY(x, y) {
        const xx = x * 0.7071067811865476;
        const yy = y * 1.224744871380249;

        return this._noise2_Base(yy + xx, yy - xx);
    }
    /**
     * 
     * @param x {number}
     * @param y {number}
     * @param z {number}
     */
    _noise3_BCC(xr, yr, zr) {
        const xrb = Math.floor(xr);
        const yrb = Math.floor(yr);
        const zrb = Math.floor(zr);
        const xri = xr - xrb;
        const yri = yr - yrb;
        const zri = zr - zrb;

        const xht = xri + 0.5;
        const yht = yri + 0.5;
        const zht = zri + 0.5;
        const index = (xht << 0) | (yht << 1) | (zht << 2);

        let value = 0;
        const c = LOOKUP_3D[index];
        while (c !== null) {
            const dxr = xri + c.dxr;
            const dyr = yri + c.dyr;
            const dzr = zri + c.dzr;
            let attn = 0.5 - dxr * dxr - dyr * dyr - dzr * dzr;
            if (attn < 0) {
                c = c.NextOnFailure;
            } else {
                const pxm = (xrb + c.xrv) & OpenSimplex2F._PMASK;
                const pym = (yrb + c.yrv) & OpenSimplex2F._PMASK;
                const pzm = (zrb + c.zrv) & OpenSimplex2F._PMASK;
                const grad = permGrad3[this._perm[this._permerm[pxm] ^ pym] ^ pzm];
                const extrapolation = grad.dx * dxr + grad.dy * dyr + grad.dz * dzr;

                attn *= attn;
                value += attn * attn * extrapolation;
                c = c.NextOnSuccess; 
            }
        }
        return value;
    }

    /**
     * 
     * @param x {number}
     * @param y {number}
     * @param z {number}
     */
    Noise3_Classic(x, y, z) {
        const r = (2.0 / 3.0) * (x + y + z);
        const xr = r - x, yr = r - y, zr = r - z;
        return this._noise3_BCC(xr, yr, zr);
    }
    /**
     * 
     * @param x {number}
     * @param y {number}
     * @param z {number}
     */
    Noise3_XYBeforeZ(x, y, z) {
        const xy = x + y;
        const s2 = xy * -0.211324865405187;
        const zz = z * 0.577350269189626;
        const xr = x + s2 - zz;
        const yr = y + s2 - zz;
        const zr = xy * 0.577350269189626 + zz;

        return this._noise3_BCC(xr, yr, zr);
    }
    /**
     * 
     * @param x {number}
     * @param y {number}
     * @param z {number}
     */
    Noise3_XZBeforeY(x, y, z) {
        const xz = x + z;
        const s2 = xz * -0.211324865405187;
        const yy = y * 0.577350269189626;
        const xr = x + s2 - yy;
        const zr = z + s2 - yy;
        const yr = xz * 0.577350269189626 + yy;
        return this._noise3_BCC(xr, yr, zr);
    }
    /**
     * 
     * @param xs {number}
     * @param ys {number}
     * @param zs {number}
     * @param ws {number}
     */
    _noise4_Base(xs, ys, zs, ws) {
        let value = 0;

        let xsb = Math.floor(xs);
        let ysb = Math.floor(ys);
        let zsb = Math.floor(zs);
        let wsb = Math.floor(ws);
        let xsi = xs - xsb;
        let ysi = ys - ysb;
        let zsi = zs - zsb;
        let wsi = ws - wsb;

        let siSum = xsi + ysi + zsi + wsi;
        let ssi = siSum * 0.309016994374947;
        const inLowerHalf = (siSum < 2);
        if (inLowerHalf)
        {
            xsi = 1 - xsi; ysi = 1 - ysi; zsi = 1 - zsi; wsi = 1 - wsi;
            siSum = 4 - siSum;
        }

        const aabb = xsi + ysi - zsi - wsi;
        const abab = xsi - ysi + zsi - wsi;
        const abba = xsi - ysi - zsi + wsi;
        const aabbScore = Math.abs(aabb), ababScore = Math.abs(abab), abbaScore = Math.abs(abba);

        let vertexIndex, via, vib;
        let asi, bsi;
        if (aabbScore > ababScore && aabbScore > abbaScore)
        {
            if (aabb > 0)
            {
                asi = zsi; bsi = wsi; vertexIndex = 0b0011; via = 0b0111; vib = 0b1011;
            }
            else
            {
                asi = xsi; bsi = ysi; vertexIndex = 0b1100; via = 0b1101; vib = 0b1110;
            }
        }
        else if (ababScore > abbaScore)
        {
            if (abab > 0)
            {
                asi = ysi; bsi = wsi; vertexIndex = 0b0101; via = 0b0111; vib = 0b1101;
            }
            else
            {
                asi = xsi; bsi = zsi; vertexIndex = 0b1010; via = 0b1011; vib = 0b1110;
            }
        }
        else
        {
            if (abba > 0)
            {
                asi = ysi; bsi = zsi; vertexIndex = 0b1001; via = 0b1011; vib = 0b1101;
            }
            else
            {
                asi = xsi; bsi = wsi; vertexIndex = 0b0110; via = 0b0111; vib = 0b1110;
            }
        }
        if (bsi > asi)
        {
            via = vib;
            const temp = bsi;
            bsi = asi;
            asi = temp;
        }
        if (siSum + asi > 3)
        {
            vertexIndex = via;
            if (siSum + bsi > 4)
            {
                vertexIndex = 0b1111;
            }
        }

        if (inLowerHalf)
        {
            xsi = 1 - xsi; ysi = 1 - ysi; zsi = 1 - zsi; wsi = 1 - wsi;
            vertexIndex ^= 0b1111;
        }

        for (let i = 0; i < 5; i++)
        {

            const c = VERTICES_4D[vertexIndex];
            xsb += c.xsv; ysb += c.ysv; zsb += c.zsv; wsb += c.wsv;
            const xi = xsi + ssi, yi = ysi + ssi, zi = zsi + ssi, wi = wsi + ssi;
            const dx = xi + c.dx, dy = yi + c.dy, dz = zi + c.dz, dw = wi + c.dw;
            const attn = 0.5 - dx * dx - dy * dy - dz * dz - dw * dw;
            if (attn > 0)
            {
                const pxm = xsb & PMASK, pym = ysb & PMASK, pzm = zsb & PMASK, pwm = wsb & PMASK;
                const grad = permGrad4[perm[perm[perm[pxm] ^ pym] ^ pzm] ^ pwm];
                const ramped = grad.dx * dx + grad.dy * dy + grad.dz * dz + grad.dw * dw;

                attn *= attn;
                value += attn * attn * ramped;
            }

            if (i == 4) break;

            xsi += c.xsi; ysi += c.ysi; zsi += c.zsi; wsi += c.wsi;
            ssi += c.ssiDelta;

            const score0 = 1.0 + ssi * (-1.0 / 0.309016994374947);
            vertexIndex = 0b0000;
            if (xsi >= ysi && xsi >= zsi && xsi >= wsi && xsi >= score0)
            {
                vertexIndex = 0b0001;
            }
            else if (ysi > xsi && ysi >= zsi && ysi >= wsi && ysi >= score0)
            {
                vertexIndex = 0b0010;
            }
            else if (zsi > xsi && zsi > ysi && zsi >= wsi && zsi >= score0)
            {
                vertexIndex = 0b0100;
            }
            else if (wsi > xsi && wsi > ysi && wsi > zsi && wsi >= score0)
            {
                vertexIndex = 0b1000;
            }
        }

        return value;
    }
    /**
     * 
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @param w {number}
     */
    Noise4_Classic(x, y, z, w) {
        const s = -0.138196601125011 * (x + y + z + w);
        const xs = x + s, ys = y + s, zs = z + s, ws = w + s;
        return this._noise4_Base(xs, ys, zs, ws);
    }
    /**
     * 
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @param w {number}
     */
    Noise4_XYBeforeZW(x, y, z, w) {

        const s2 = (x + y) * -0.178275657951399372 + (z + w) * 0.215623393288842828;
        const t2 = (z + w) * -0.403949762580207112 + (x + y) * -0.375199083010075342;
        const xs = x + s2, ys = y + s2, zs = z + t2, ws = w + t2;

        return this._noise4_Base(xs, ys, zs, ws);
    }
    /**
     * 
     * @param x {number}
     * @param y {number}
     * @param z {number}
     * @param w {number}
     */
    Noise4_XZBeforeYW(x, y, z, w) {

        const s2 = (x + z) * -0.178275657951399372 + (y + w) * 0.215623393288842828;
        const t2 = (y + w) * -0.403949762580207112 + (x + z) * -0.375199083010075342;
        const xs = x + s2, ys = y + t2, zs = z + s2, ws = w + t2;

        return noise4_Base(xs, ys, zs, ws);
    }
    Noise4_XYZBeforeW(x, y, z, w)
    {
        const xyz = x + y + z;
        const ww = w * 0.2236067977499788;
        const s2 = xyz * -0.16666666666666666 + ww;
        const xs = x + s2, ys = y + s2, zs = z + s2, ws = -0.5 * xyz + ww;

        return noise4_Base(xs, ys, zs, ws);
    }

    /**
     * @type {LatticePoint2D[]}
     */
    static _LOOKUP_2D = [];
    /**
     * @type {LatticePoint3D[]}
     */
    static _LOOKUP_3D = [];
    /**
     * @type {LatticePoint4D[]}
     */
    static _VERTICES_4D = [];

    static _N2 = 0.01001634121365712;
    static _N3 = 0.030485933181293584;
    static _N4 = 0.009202377986303158;
    /**
     * @type {Grad2[]}
     */
    static _GRADIENTS_2D = [];
    /**
     * @type {Grad3[]}
     */
    static _GRADIENTS_3D = [];
    /**
     * @type {Grad4[]}
     */
    static _GRADIENTS_4D = [];
}

OpenSimplex2F._LOOKUP_2D[0] = new LatticePoint2D(1, 0);
OpenSimplex2F._LOOKUP_2D[1] = new LatticePoint2D(0, 0);
OpenSimplex2F._LOOKUP_2D[2] = new LatticePoint2D(1, 1);
OpenSimplex2F._LOOKUP_2D[3] = new LatticePoint2D(0, 1);

for (let i = 0; i < 8; i++) {
    let i1, j1, k1, i2, j2, k2;
    i1 = (i >> 0) & 1; j1 = (i >> 1) & 1; k1 = (i >> 2) & 1;
    i2 = i1 ^ 1; j2 = j1 ^ 1; k2 = k1 ^ 1;

    // The two points within this octant, one from each of the two cubic half-lattices.
    const c0 = new LatticePoint3D(i1, j1, k1, 0);
    const c1 = new LatticePoint3D(i1 + i2, j1 + j2, k1 + k2, 1);

    // Each single step away on the first half-lattice.
    const c2 = new LatticePoint3D(i1 ^ 1, j1, k1, 0);
    const c3 = new LatticePoint3D(i1, j1 ^ 1, k1, 0);
    const c4 = new LatticePoint3D(i1, j1, k1 ^ 1, 0);

    // Each single step away on the second half-lattice.
    const c5 = new LatticePoint3D(i1 + (i2 ^ 1), j1 + j2, k1 + k2, 1);
    const c6 = new LatticePoint3D(i1 + i2, j1 + (j2 ^ 1), k1 + k2, 1);
    const c7 = new LatticePoint3D(i1 + i2, j1 + j2, k1 + (k2 ^ 1), 1);

    // First two are guaranteed.
    c0.NextOnFailure = c0.NextOnSuccess = c1;
    c1.NextOnFailure = c1.NextOnSuccess = c2;

    // Once we find one on the first half-lattice, the rest are out.
    // In addition, knowing c2 rules out c5.
    c2.NextOnFailure = c3; c2.NextOnSuccess = c6;
    c3.NextOnFailure = c4; c3.NextOnSuccess = c5;
    c4.NextOnFailure = c4.NextOnSuccess = c5;

    // Once we find one on the second half-lattice, the rest are out.
    c5.NextOnFailure = c6; c5.NextOnSuccess = null;
    c6.NextOnFailure = c7; c6.NextOnSuccess = null;
    c7.NextOnFailure = c7.NextOnSuccess = null;

    OpenSimplex2F._LOOKUP_3D[i] = c0;
}

for (let i = 0; i < 16; i++) {
    OpenSimplex2F._VERTICES_4D[i] = new LatticePoint4D((i >> 0) & 1, (i >> 1) & 1, (i >> 2) & 1, (i >> 3) & 1);
}

const grad2 = [
    new Grad2( 0.130526192220052,  0.99144486137381),
    new Grad2( 0.38268343236509,   0.923879532511287),
    new Grad2( 0.608761429008721,  0.793353340291235),
    new Grad2( 0.793353340291235,  0.608761429008721),
    new Grad2( 0.923879532511287,  0.38268343236509),
    new Grad2( 0.99144486137381,   0.130526192220051),
    new Grad2( 0.99144486137381,  -0.130526192220051),
    new Grad2( 0.923879532511287, -0.38268343236509),
    new Grad2( 0.793353340291235, -0.60876142900872),
    new Grad2( 0.608761429008721, -0.793353340291235),
    new Grad2( 0.38268343236509,  -0.923879532511287),
    new Grad2( 0.130526192220052, -0.99144486137381),
    new Grad2(-0.130526192220052, -0.99144486137381),
    new Grad2(-0.38268343236509,  -0.923879532511287),
    new Grad2(-0.608761429008721, -0.793353340291235),
    new Grad2(-0.793353340291235, -0.608761429008721),
    new Grad2(-0.923879532511287, -0.38268343236509),
    new Grad2(-0.99144486137381,  -0.130526192220052),
    new Grad2(-0.99144486137381,   0.130526192220051),
    new Grad2(-0.923879532511287,  0.38268343236509),
    new Grad2(-0.793353340291235,  0.608761429008721),
    new Grad2(-0.608761429008721,  0.793353340291235),
    new Grad2(-0.38268343236509,   0.923879532511287),
    new Grad2(-0.130526192220052,  0.99144486137381)
]
for (let i = 0; i < grad2.length; i++) {
    grad2[i].dx /= OpenSimplex2F._N2; grad2[i].dy /= OpenSimplex2F._N2;
}
for (let i = 0; i < OpenSimplex2F._PSIZE; i++) {
    OpenSimplex2F._GRADIENTS_2D[i] = grad2[i % grad2.length];
}

const grad3 = [
    new Grad3(-2.22474487139,      -2.22474487139,      -1.0),
    new Grad3(-2.22474487139,      -2.22474487139,       1.0),
    new Grad3(-3.0862664687972017, -1.1721513422464978,  0.0),
    new Grad3(-1.1721513422464978, -3.0862664687972017,  0.0),
    new Grad3(-2.22474487139,      -1.0,                -2.22474487139),
    new Grad3(-2.22474487139,       1.0,                -2.22474487139),
    new Grad3(-1.1721513422464978,  0.0,                -3.0862664687972017),
    new Grad3(-3.0862664687972017,  0.0,                -1.1721513422464978),
    new Grad3(-2.22474487139,      -1.0,                 2.22474487139),
    new Grad3(-2.22474487139,       1.0,                 2.22474487139),
    new Grad3(-3.0862664687972017,  0.0,                 1.1721513422464978),
    new Grad3(-1.1721513422464978,  0.0,                 3.0862664687972017),
    new Grad3(-2.22474487139,       2.22474487139,      -1.0),
    new Grad3(-2.22474487139,       2.22474487139,       1.0),
    new Grad3(-1.1721513422464978,  3.0862664687972017,  0.0),
    new Grad3(-3.0862664687972017,  1.1721513422464978,  0.0),
    new Grad3(-1.0,                -2.22474487139,      -2.22474487139),
    new Grad3( 1.0,                -2.22474487139,      -2.22474487139),
    new Grad3( 0.0,                -3.0862664687972017, -1.1721513422464978),
    new Grad3( 0.0,                -1.1721513422464978, -3.0862664687972017),
    new Grad3(-1.0,                -2.22474487139,       2.22474487139),
    new Grad3( 1.0,                -2.22474487139,       2.22474487139),
    new Grad3( 0.0,                -1.1721513422464978,  3.0862664687972017),
    new Grad3( 0.0,                -3.0862664687972017,  1.1721513422464978),
    new Grad3(-1.0,                 2.22474487139,      -2.22474487139),
    new Grad3( 1.0,                 2.22474487139,      -2.22474487139),
    new Grad3( 0.0,                 1.1721513422464978, -3.0862664687972017),
    new Grad3( 0.0,                 3.0862664687972017, -1.1721513422464978),
    new Grad3(-1.0,                 2.22474487139,       2.22474487139),
    new Grad3( 1.0,                 2.22474487139,       2.22474487139),
    new Grad3( 0.0,                 3.0862664687972017,  1.1721513422464978),
    new Grad3( 0.0,                 1.1721513422464978,  3.0862664687972017),
    new Grad3( 2.22474487139,      -2.22474487139,      -1.0),
    new Grad3( 2.22474487139,      -2.22474487139,       1.0),
    new Grad3( 1.1721513422464978, -3.0862664687972017,  0.0),
    new Grad3( 3.0862664687972017, -1.1721513422464978,  0.0),
    new Grad3( 2.22474487139,      -1.0,                -2.22474487139),
    new Grad3( 2.22474487139,       1.0,                -2.22474487139),
    new Grad3( 3.0862664687972017,  0.0,                -1.1721513422464978),
    new Grad3( 1.1721513422464978,  0.0,                -3.0862664687972017),
    new Grad3( 2.22474487139,      -1.0,                 2.22474487139),
    new Grad3( 2.22474487139,       1.0,                 2.22474487139),
    new Grad3( 1.1721513422464978,  0.0,                 3.0862664687972017),
    new Grad3( 3.0862664687972017,  0.0,                 1.1721513422464978),
    new Grad3( 2.22474487139,       2.22474487139,      -1.0),
    new Grad3( 2.22474487139,       2.22474487139,       1.0),
    new Grad3( 3.0862664687972017,  1.1721513422464978,  0.0),
    new Grad3( 1.1721513422464978,  3.0862664687972017,  0.0)
];
for (let i = 0; i < grad3.length; i++)
{
    grad3[i].dx /= OpenSimplex2F._N3; grad3[i].dy /= OpenSimplex2F._N3; grad3[i].dz /= OpenSimplex2F._N3;
}
for (let i = 0; i < OpenSimplex2F._PSIZE; i++)
{
    OpenSimplex2F._GRADIENTS_3D[i] = grad3[i % grad3.length];
}

const grad4 = [
    new Grad4(-0.753341017856078,    -0.37968289875261624,  -0.37968289875261624,  -0.37968289875261624),
    new Grad4(-0.7821684431180708,   -0.4321472685365301,   -0.4321472685365301,    0.12128480194602098),
    new Grad4(-0.7821684431180708,   -0.4321472685365301,    0.12128480194602098,  -0.4321472685365301),
    new Grad4(-0.7821684431180708,    0.12128480194602098,  -0.4321472685365301,   -0.4321472685365301),
    new Grad4(-0.8586508742123365,   -0.508629699630796,     0.044802370851755174,  0.044802370851755174),
    new Grad4(-0.8586508742123365,    0.044802370851755174, -0.508629699630796,     0.044802370851755174),
    new Grad4(-0.8586508742123365,    0.044802370851755174,  0.044802370851755174, -0.508629699630796),
    new Grad4(-0.9982828964265062,   -0.03381941603233842,  -0.03381941603233842,  -0.03381941603233842),
    new Grad4(-0.37968289875261624,  -0.753341017856078,    -0.37968289875261624,  -0.37968289875261624),
    new Grad4(-0.4321472685365301,   -0.7821684431180708,   -0.4321472685365301,    0.12128480194602098),
    new Grad4(-0.4321472685365301,   -0.7821684431180708,    0.12128480194602098,  -0.4321472685365301),
    new Grad4( 0.12128480194602098,  -0.7821684431180708,   -0.4321472685365301,   -0.4321472685365301),
    new Grad4(-0.508629699630796,    -0.8586508742123365,    0.044802370851755174,  0.044802370851755174),
    new Grad4( 0.044802370851755174, -0.8586508742123365,   -0.508629699630796,     0.044802370851755174),
    new Grad4( 0.044802370851755174, -0.8586508742123365,    0.044802370851755174, -0.508629699630796),
    new Grad4(-0.03381941603233842,  -0.9982828964265062,   -0.03381941603233842,  -0.03381941603233842),
    new Grad4(-0.37968289875261624,  -0.37968289875261624,  -0.753341017856078,    -0.37968289875261624),
    new Grad4(-0.4321472685365301,   -0.4321472685365301,   -0.7821684431180708,    0.12128480194602098),
    new Grad4(-0.4321472685365301,    0.12128480194602098,  -0.7821684431180708,   -0.4321472685365301),
    new Grad4( 0.12128480194602098,  -0.4321472685365301,   -0.7821684431180708,   -0.4321472685365301),
    new Grad4(-0.508629699630796,     0.044802370851755174, -0.8586508742123365,    0.044802370851755174),
    new Grad4( 0.044802370851755174, -0.508629699630796,    -0.8586508742123365,    0.044802370851755174),
    new Grad4( 0.044802370851755174,  0.044802370851755174, -0.8586508742123365,   -0.508629699630796),
    new Grad4(-0.03381941603233842,  -0.03381941603233842,  -0.9982828964265062,   -0.03381941603233842),
    new Grad4(-0.37968289875261624,  -0.37968289875261624,  -0.37968289875261624,  -0.753341017856078),
    new Grad4(-0.4321472685365301,   -0.4321472685365301,    0.12128480194602098,  -0.7821684431180708),
    new Grad4(-0.4321472685365301,    0.12128480194602098,  -0.4321472685365301,   -0.7821684431180708),
    new Grad4( 0.12128480194602098,  -0.4321472685365301,   -0.4321472685365301,   -0.7821684431180708),
    new Grad4(-0.508629699630796,     0.044802370851755174,  0.044802370851755174, -0.8586508742123365),
    new Grad4( 0.044802370851755174, -0.508629699630796,     0.044802370851755174, -0.8586508742123365),
    new Grad4( 0.044802370851755174,  0.044802370851755174, -0.508629699630796,    -0.8586508742123365),
    new Grad4(-0.03381941603233842,  -0.03381941603233842,  -0.03381941603233842,  -0.9982828964265062),
    new Grad4(-0.6740059517812944,   -0.3239847771997537,   -0.3239847771997537,    0.5794684678643381),
    new Grad4(-0.7504883828755602,   -0.4004672082940195,    0.15296486218853164,   0.5029860367700724),
    new Grad4(-0.7504883828755602,    0.15296486218853164,  -0.4004672082940195,    0.5029860367700724),
    new Grad4(-0.8828161875373585,    0.08164729285680945,   0.08164729285680945,   0.4553054119602712),
    new Grad4(-0.4553054119602712,   -0.08164729285680945,  -0.08164729285680945,   0.8828161875373585),
    new Grad4(-0.5029860367700724,   -0.15296486218853164,   0.4004672082940195,    0.7504883828755602),
    new Grad4(-0.5029860367700724,    0.4004672082940195,   -0.15296486218853164,   0.7504883828755602),
    new Grad4(-0.5794684678643381,    0.3239847771997537,    0.3239847771997537,    0.6740059517812944),
    new Grad4(-0.3239847771997537,   -0.6740059517812944,   -0.3239847771997537,    0.5794684678643381),
    new Grad4(-0.4004672082940195,   -0.7504883828755602,    0.15296486218853164,   0.5029860367700724),
    new Grad4( 0.15296486218853164,  -0.7504883828755602,   -0.4004672082940195,    0.5029860367700724),
    new Grad4( 0.08164729285680945,  -0.8828161875373585,    0.08164729285680945,   0.4553054119602712),
    new Grad4(-0.08164729285680945,  -0.4553054119602712,   -0.08164729285680945,   0.8828161875373585),
    new Grad4(-0.15296486218853164,  -0.5029860367700724,    0.4004672082940195,    0.7504883828755602),
    new Grad4( 0.4004672082940195,   -0.5029860367700724,   -0.15296486218853164,   0.7504883828755602),
    new Grad4( 0.3239847771997537,   -0.5794684678643381,    0.3239847771997537,    0.6740059517812944),
    new Grad4(-0.3239847771997537,   -0.3239847771997537,   -0.6740059517812944,    0.5794684678643381),
    new Grad4(-0.4004672082940195,    0.15296486218853164,  -0.7504883828755602,    0.5029860367700724),
    new Grad4( 0.15296486218853164,  -0.4004672082940195,   -0.7504883828755602,    0.5029860367700724),
    new Grad4( 0.08164729285680945,   0.08164729285680945,  -0.8828161875373585,    0.4553054119602712),
    new Grad4(-0.08164729285680945,  -0.08164729285680945,  -0.4553054119602712,    0.8828161875373585),
    new Grad4(-0.15296486218853164,   0.4004672082940195,   -0.5029860367700724,    0.7504883828755602),
    new Grad4( 0.4004672082940195,   -0.15296486218853164,  -0.5029860367700724,    0.7504883828755602),
    new Grad4( 0.3239847771997537,    0.3239847771997537,   -0.5794684678643381,    0.6740059517812944),
    new Grad4(-0.6740059517812944,   -0.3239847771997537,    0.5794684678643381,   -0.3239847771997537),
    new Grad4(-0.7504883828755602,   -0.4004672082940195,    0.5029860367700724,    0.15296486218853164),
    new Grad4(-0.7504883828755602,    0.15296486218853164,   0.5029860367700724,   -0.4004672082940195),
    new Grad4(-0.8828161875373585,    0.08164729285680945,   0.4553054119602712,    0.08164729285680945),
    new Grad4(-0.4553054119602712,   -0.08164729285680945,   0.8828161875373585,   -0.08164729285680945),
    new Grad4(-0.5029860367700724,   -0.15296486218853164,   0.7504883828755602,    0.4004672082940195),
    new Grad4(-0.5029860367700724,    0.4004672082940195,    0.7504883828755602,   -0.15296486218853164),
    new Grad4(-0.5794684678643381,    0.3239847771997537,    0.6740059517812944,    0.3239847771997537),
    new Grad4(-0.3239847771997537,   -0.6740059517812944,    0.5794684678643381,   -0.3239847771997537),
    new Grad4(-0.4004672082940195,   -0.7504883828755602,    0.5029860367700724,    0.15296486218853164),
    new Grad4( 0.15296486218853164,  -0.7504883828755602,    0.5029860367700724,   -0.4004672082940195),
    new Grad4( 0.08164729285680945,  -0.8828161875373585,    0.4553054119602712,    0.08164729285680945),
    new Grad4(-0.08164729285680945,  -0.4553054119602712,    0.8828161875373585,   -0.08164729285680945),
    new Grad4(-0.15296486218853164,  -0.5029860367700724,    0.7504883828755602,    0.4004672082940195),
    new Grad4( 0.4004672082940195,   -0.5029860367700724,    0.7504883828755602,   -0.15296486218853164),
    new Grad4( 0.3239847771997537,   -0.5794684678643381,    0.6740059517812944,    0.3239847771997537),
    new Grad4(-0.3239847771997537,   -0.3239847771997537,    0.5794684678643381,   -0.6740059517812944),
    new Grad4(-0.4004672082940195,    0.15296486218853164,   0.5029860367700724,   -0.7504883828755602),
    new Grad4( 0.15296486218853164,  -0.4004672082940195,    0.5029860367700724,   -0.7504883828755602),
    new Grad4( 0.08164729285680945,   0.08164729285680945,   0.4553054119602712,   -0.8828161875373585),
    new Grad4(-0.08164729285680945,  -0.08164729285680945,   0.8828161875373585,   -0.4553054119602712),
    new Grad4(-0.15296486218853164,   0.4004672082940195,    0.7504883828755602,   -0.5029860367700724),
    new Grad4( 0.4004672082940195,   -0.15296486218853164,   0.7504883828755602,   -0.5029860367700724),
    new Grad4( 0.3239847771997537,    0.3239847771997537,    0.6740059517812944,   -0.5794684678643381),
    new Grad4(-0.6740059517812944,    0.5794684678643381,   -0.3239847771997537,   -0.3239847771997537),
    new Grad4(-0.7504883828755602,    0.5029860367700724,   -0.4004672082940195,    0.15296486218853164),
    new Grad4(-0.7504883828755602,    0.5029860367700724,    0.15296486218853164,  -0.4004672082940195),
    new Grad4(-0.8828161875373585,    0.4553054119602712,    0.08164729285680945,   0.08164729285680945),
    new Grad4(-0.4553054119602712,    0.8828161875373585,   -0.08164729285680945,  -0.08164729285680945),
    new Grad4(-0.5029860367700724,    0.7504883828755602,   -0.15296486218853164,   0.4004672082940195),
    new Grad4(-0.5029860367700724,    0.7504883828755602,    0.4004672082940195,   -0.15296486218853164),
    new Grad4(-0.5794684678643381,    0.6740059517812944,    0.3239847771997537,    0.3239847771997537),
    new Grad4(-0.3239847771997537,    0.5794684678643381,   -0.6740059517812944,   -0.3239847771997537),
    new Grad4(-0.4004672082940195,    0.5029860367700724,   -0.7504883828755602,    0.15296486218853164),
    new Grad4( 0.15296486218853164,   0.5029860367700724,   -0.7504883828755602,   -0.4004672082940195),
    new Grad4( 0.08164729285680945,   0.4553054119602712,   -0.8828161875373585,    0.08164729285680945),
    new Grad4(-0.08164729285680945,   0.8828161875373585,   -0.4553054119602712,   -0.08164729285680945),
    new Grad4(-0.15296486218853164,   0.7504883828755602,   -0.5029860367700724,    0.4004672082940195),
    new Grad4( 0.4004672082940195,    0.7504883828755602,   -0.5029860367700724,   -0.15296486218853164),
    new Grad4( 0.3239847771997537,    0.6740059517812944,   -0.5794684678643381,    0.3239847771997537),
    new Grad4(-0.3239847771997537,    0.5794684678643381,   -0.3239847771997537,   -0.6740059517812944),
    new Grad4(-0.4004672082940195,    0.5029860367700724,    0.15296486218853164,  -0.7504883828755602),
    new Grad4( 0.15296486218853164,   0.5029860367700724,   -0.4004672082940195,   -0.7504883828755602),
    new Grad4( 0.08164729285680945,   0.4553054119602712,    0.08164729285680945,  -0.8828161875373585),
    new Grad4(-0.08164729285680945,   0.8828161875373585,   -0.08164729285680945,  -0.4553054119602712),
    new Grad4(-0.15296486218853164,   0.7504883828755602,    0.4004672082940195,   -0.5029860367700724),
    new Grad4( 0.4004672082940195,    0.7504883828755602,   -0.15296486218853164,  -0.5029860367700724),
    new Grad4( 0.3239847771997537,    0.6740059517812944,    0.3239847771997537,   -0.5794684678643381),
    new Grad4( 0.5794684678643381,   -0.6740059517812944,   -0.3239847771997537,   -0.3239847771997537),
    new Grad4( 0.5029860367700724,   -0.7504883828755602,   -0.4004672082940195,    0.15296486218853164),
    new Grad4( 0.5029860367700724,   -0.7504883828755602,    0.15296486218853164,  -0.4004672082940195),
    new Grad4( 0.4553054119602712,   -0.8828161875373585,    0.08164729285680945,   0.08164729285680945),
    new Grad4( 0.8828161875373585,   -0.4553054119602712,   -0.08164729285680945,  -0.08164729285680945),
    new Grad4( 0.7504883828755602,   -0.5029860367700724,   -0.15296486218853164,   0.4004672082940195),
    new Grad4( 0.7504883828755602,   -0.5029860367700724,    0.4004672082940195,   -0.15296486218853164),
    new Grad4( 0.6740059517812944,   -0.5794684678643381,    0.3239847771997537,    0.3239847771997537),
    new Grad4( 0.5794684678643381,   -0.3239847771997537,   -0.6740059517812944,   -0.3239847771997537),
    new Grad4( 0.5029860367700724,   -0.4004672082940195,   -0.7504883828755602,    0.15296486218853164),
    new Grad4( 0.5029860367700724,    0.15296486218853164,  -0.7504883828755602,   -0.4004672082940195),
    new Grad4( 0.4553054119602712,    0.08164729285680945,  -0.8828161875373585,    0.08164729285680945),
    new Grad4( 0.8828161875373585,   -0.08164729285680945,  -0.4553054119602712,   -0.08164729285680945),
    new Grad4( 0.7504883828755602,   -0.15296486218853164,  -0.5029860367700724,    0.4004672082940195),
    new Grad4( 0.7504883828755602,    0.4004672082940195,   -0.5029860367700724,   -0.15296486218853164),
    new Grad4( 0.6740059517812944,    0.3239847771997537,   -0.5794684678643381,    0.3239847771997537),
    new Grad4( 0.5794684678643381,   -0.3239847771997537,   -0.3239847771997537,   -0.6740059517812944),
    new Grad4( 0.5029860367700724,   -0.4004672082940195,    0.15296486218853164,  -0.7504883828755602),
    new Grad4( 0.5029860367700724,    0.15296486218853164,  -0.4004672082940195,   -0.7504883828755602),
    new Grad4( 0.4553054119602712,    0.08164729285680945,   0.08164729285680945,  -0.8828161875373585),
    new Grad4( 0.8828161875373585,   -0.08164729285680945,  -0.08164729285680945,  -0.4553054119602712),
    new Grad4( 0.7504883828755602,   -0.15296486218853164,   0.4004672082940195,   -0.5029860367700724),
    new Grad4( 0.7504883828755602,    0.4004672082940195,   -0.15296486218853164,  -0.5029860367700724),
    new Grad4( 0.6740059517812944,    0.3239847771997537,    0.3239847771997537,   -0.5794684678643381),
    new Grad4( 0.03381941603233842,   0.03381941603233842,   0.03381941603233842,   0.9982828964265062),
    new Grad4(-0.044802370851755174, -0.044802370851755174,  0.508629699630796,     0.8586508742123365),
    new Grad4(-0.044802370851755174,  0.508629699630796,    -0.044802370851755174,  0.8586508742123365),
    new Grad4(-0.12128480194602098,   0.4321472685365301,    0.4321472685365301,    0.7821684431180708),
    new Grad4( 0.508629699630796,    -0.044802370851755174, -0.044802370851755174,  0.8586508742123365),
    new Grad4( 0.4321472685365301,   -0.12128480194602098,   0.4321472685365301,    0.7821684431180708),
    new Grad4( 0.4321472685365301,    0.4321472685365301,   -0.12128480194602098,   0.7821684431180708),
    new Grad4( 0.37968289875261624,   0.37968289875261624,   0.37968289875261624,   0.753341017856078),
    new Grad4( 0.03381941603233842,   0.03381941603233842,   0.9982828964265062,    0.03381941603233842),
    new Grad4(-0.044802370851755174,  0.044802370851755174,  0.8586508742123365,    0.508629699630796),
    new Grad4(-0.044802370851755174,  0.508629699630796,     0.8586508742123365,   -0.044802370851755174),
    new Grad4(-0.12128480194602098,   0.4321472685365301,    0.7821684431180708,    0.4321472685365301),
    new Grad4( 0.508629699630796,    -0.044802370851755174,  0.8586508742123365,   -0.044802370851755174),
    new Grad4( 0.4321472685365301,   -0.12128480194602098,   0.7821684431180708,    0.4321472685365301),
    new Grad4( 0.4321472685365301,    0.4321472685365301,    0.7821684431180708,   -0.12128480194602098),
    new Grad4( 0.37968289875261624,   0.37968289875261624,   0.753341017856078,     0.37968289875261624),
    new Grad4( 0.03381941603233842,   0.9982828964265062,    0.03381941603233842,   0.03381941603233842),
    new Grad4(-0.044802370851755174,  0.8586508742123365,   -0.044802370851755174,  0.508629699630796),
    new Grad4(-0.044802370851755174,  0.8586508742123365,    0.508629699630796,    -0.044802370851755174),
    new Grad4(-0.12128480194602098,   0.7821684431180708,    0.4321472685365301,    0.4321472685365301),
    new Grad4( 0.508629699630796,     0.8586508742123365,   -0.044802370851755174, -0.044802370851755174),
    new Grad4( 0.4321472685365301,    0.7821684431180708,   -0.12128480194602098,   0.4321472685365301),
    new Grad4( 0.4321472685365301,    0.7821684431180708,    0.4321472685365301,   -0.12128480194602098),
    new Grad4( 0.37968289875261624,   0.753341017856078,     0.37968289875261624,   0.37968289875261624),
    new Grad4( 0.9982828964265062,    0.03381941603233842,   0.03381941603233842,   0.03381941603233842),
    new Grad4( 0.8586508742123365,   -0.044802370851755174, -0.044802370851755174,  0.508629699630796),
    new Grad4( 0.8586508742123365,   -0.044802370851755174,  0.508629699630796,    -0.044802370851755174),
    new Grad4( 0.7821684431180708,   -0.12128480194602098,   0.4321472685365301,    0.4321472685365301),
    new Grad4( 0.8586508742123365,    0.508629699630796,    -0.044802370851755174, -0.044802370851755174),
    new Grad4( 0.7821684431180708,    0.4321472685365301,   -0.12128480194602098,   0.4321472685365301),
    new Grad4( 0.7821684431180708,    0.4321472685365301,    0.4321472685365301,   -0.12128480194602098),
    new Grad4( 0.753341017856078,     0.37968289875261624,   0.37968289875261624,   0.37968289875261624)
];
for (let i = 0; i < grad4.length; i++)
{
    grad4[i].dx /= OpenSimplex2F._N4;
    grad4[i].dy /= OpenSimplex2F._N4;
    grad4[i].dz /= OpenSimplex2F._N4; grad4[i].dw /= OpenSimplex2F._N4;
}
for (let i = 0; i < OpenSimplex2F._PSIZE; i++)
{
    OpenSimplex2F._GRADIENTS_4D[i] = grad4[i % grad4.Length];
}