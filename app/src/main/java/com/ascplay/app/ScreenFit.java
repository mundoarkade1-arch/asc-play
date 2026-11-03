package com.ascplay.app;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.ViewGroup;
import android.widget.GridView;

/**
 * Ajuda o app a se adaptar ao tamanho da tela (celular e TV), sem mudar o visual.
 * Os tamanhos de letras, botões e cartões ficam nos arquivos dimens.xml (pastas values, values-h400dp
 * e values-h480dp), escolhidos pela altura da tela.
 * Esta classe cuida só do que o XML não consegue: número de colunas das grades e largura máxima.
 */
final class ScreenFit {

    private ScreenFit() {
    }

    /** Altura da tela em dp. */
    static float heightDp(Context context) {
        DisplayMetrics dm = context.getResources().getDisplayMetrics();
        return dm.heightPixels / dm.density;
    }

    /** Largura da tela em dp. */
    static float widthDp(Context context) {
        DisplayMetrics dm = context.getResources().getDisplayMetrics();
        return dm.widthPixels / dm.density;
    }

    /**
     * Faz a grade ter quantas colunas couberem (de 1 até maxCols), cada uma com pelo menos
     * colWidthPx de largura. Na TV (tela larga) dá o mesmo número de colunas de antes (maxCols);
     * no celular dá menos colunas, para os cartões não ficarem um por cima do outro.
     * Refaz a conta sempre que o tamanho da grade muda (girar a tela, janela dividida).
     */
    static void fitColumns(final GridView grid, final int colWidthPx, final int maxCols) {
        if (grid == null || colWidthPx <= 0) {
            return;
        }
        grid.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
            @Override
            public void onLayoutChange(View v, int left, int top, int right, int bottom,
                                       int oldLeft, int oldTop, int oldRight, int oldBottom) {
                if (right - left == oldRight - oldLeft) {
                    return; // largura igual: nada a refazer
                }
                grid.post(new Runnable() {
                    @Override
                    public void run() {
                        int avail = grid.getWidth() - grid.getPaddingLeft()
                                - grid.getPaddingRight();
                        if (avail <= 0) {
                            return;
                        }
                        int spacing = Math.max(0, grid.getHorizontalSpacing());
                        int cols = (avail + spacing) / (colWidthPx + spacing);
                        cols = Math.max(1, Math.min(maxCols, cols));
                        if (cols != grid.getNumColumns()) {
                            grid.setNumColumns(cols);
                        }
                    }
                });
            }
        });
    }

    /**
     * Limita a largura de uma caixa a maxDp, mas nunca mais do que a tela menos as margens.
     * Usada na caixa do login (560dp na TV; menor se a tela for estreita).
     */
    static void limitWidth(View box, int maxDp, int sideMarginDp) {
        if (box == null) {
            return;
        }
        DisplayMetrics dm = box.getResources().getDisplayMetrics();
        int max = Math.round(maxDp * dm.density);
        int avail = dm.widthPixels - Math.round(2 * sideMarginDp * dm.density);
        int width = Math.max(1, Math.min(max, avail));
        ViewGroup.LayoutParams lp = box.getLayoutParams();
        if (lp != null && lp.width != width) {
            lp.width = width;
            box.setLayoutParams(lp);
        }
    }
}
