export class LatticePoint2D
{
    /**
     * 
     * @param xsv {number}
     * @param ysv {number}
     */
    constructor(xsv, ysv)
    {
        this.xsv = xsv;
        this.ysv = ysv;
        const ssv = (xsv + ysv) * -0.211324865405187;
        this.dx = -xsv - ssv;
        this.dy = -ysv - ssv;
    }
}
export class LatticePoint3D {
    /**
     * @type {LatticePoint3D}
     */
    NextOnFailure;
    /**
     * @type {LatticePoint3D}
     */
    NextOnSuccess;
    constructor(xrv, yrv, zrv, lattice)
    {
        this.dxr = -xrv + lattice * 0.5;
        this.dyr = -yrv + lattice * 0.5;
        this.dzr = -zrv + lattice * 0.5;
        this.xrv = xrv + lattice * 1024;
        this.yrv = yrv + lattice * 1024;
        this.zrv = zrv + lattice * 1024;
    }
}
export class LatticePoint4D {
    constructor(xsv, ysv, zsv, wsv)
    {
        this.xsv = xsv + 409;
        this.ysv = ysv + 409;
        this.zsv = zsv + 409;
        this.wsv = wsv + 409;
        const ssv = (xsv + ysv + zsv + wsv) * 0.309016994374947;
        this.dx = -xsv - ssv;
        this.dy = -ysv - ssv;
        this.dz = -zsv - ssv;
        this.dw = -wsv - ssv;
        this.xsi = 0.2 - xsv;
        this.ysi = 0.2 - ysv;
        this.zsi = 0.2 - zsv;
        this.wsi = 0.2 - wsv;
        this.ssiDelta = (0.8 - xsv - ysv - zsv - wsv) * 0.309016994374947;
    }
}